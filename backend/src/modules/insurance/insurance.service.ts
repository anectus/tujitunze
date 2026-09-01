import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';

interface ClaimRow {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  approved_amount: string | null;
  claim_status: string;
  claim_date: Date;
  processed_date: Date | null;
  remarks: string | null;
  member_id: number;
  hospital_name: string | null;
}

interface SettlementRow {
  settlement_id: number;
  counterparty_name: string;
  amount: string;
  settlement_status: string;
  settlement_date: Date;
}

export interface AllocationListFilters {
  status?: string;
  channel?: 'AIRTIME' | 'BANK_TRANSFER';
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class InsuranceService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // Shared by getDashboard() (existing, unchanged shape) and the new
  // getDashboardSummary() below — one query, not duplicated per caller.
  // No hospital_id/treatment_id/hospital join here: this is a pure
  // status/amount aggregation, not the claim-detail view listClaims()
  // provides (which does join hospitals — that join is the deliberately
  // retained historical field from the original Hospital-removal pass,
  // untouched by this change).
  private async getClaimsAggregate(providerId: number) {
    const rows = await this.dataSource.query<
      {
        claim_status: string;
        count: number;
        claim_amount_total: string;
        approved_amount_total: string;
      }[]
    >(
      `SELECT hc.claim_status, COUNT(*)::int AS count,
              COALESCE(SUM(hc.claim_amount), 0) AS claim_amount_total,
              COALESCE(SUM(hc.approved_amount), 0) AS approved_amount_total
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       GROUP BY hc.claim_status`,
      [providerId],
    );

    const byStatus: Record<string, { count: number; amount: number }> = {};
    let total = 0;
    let claimedAmount = 0;
    let approvedAmount = 0;

    for (const row of rows) {
      byStatus[row.claim_status] = {
        count: row.count,
        amount: Number(row.claim_amount_total),
      };
      total += row.count;
      claimedAmount += Number(row.claim_amount_total);
      // approved_amount is only ever populated on rows that were
      // actually approved (see updateClaimStatus()) — summing it across
      // every status is safe and avoids a second filtered query.
      approvedAmount += Number(row.approved_amount_total);
    }

    return {
      total,
      // The application layer (UpdateClaimStatusDto) only ever
      // transitions a claim to 'Approved' or 'Rejected' — there is no
      // Submitted/Under Review/Partially Approved/Settled status
      // anywhere in this codebase's claim workflow today, so those
      // buckets are intentionally omitted rather than reported as a
      // fabricated zero. byStatus below reflects whatever statuses
      // genuinely exist in the data.
      pending: byStatus['Pending']?.count ?? 0,
      approved: byStatus['Approved']?.count ?? 0,
      rejected: byStatus['Rejected']?.count ?? 0,
      claimedAmount,
      approvedAmount,
      byStatus,
    };
  }

  async getDashboard(userId: number) {
    const providerId = await this.getAssignedProviderId(userId);

    const [provider] = await this.dataSource.query<
      { provider_name: string; status: string }[]
    >(
      `SELECT provider_name, status FROM insurance_providers WHERE provider_id = $1`,
      [providerId],
    );

    const [{ count: planCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM insurance_plans
       WHERE provider_id = $1`,
      [providerId],
    );

    const [{ count: activePolicyCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM member_insurance mi
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1 AND mi.policy_status = 'Active'`,
      [providerId],
    );

    const claimsAggregate = await this.getClaimsAggregate(providerId);

    const recentClaims = await this.dataSource.query<ClaimRow[]>(
      `SELECT hc.claim_id, hc.claim_number, hc.claim_amount, hc.claim_status, hc.claim_date
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       ORDER BY hc.claim_date DESC
       LIMIT 5`,
      [providerId],
    );

    return {
      provider: {
        name: provider?.provider_name ?? null,
        status: provider?.status ?? null,
      },
      planCount,
      activePolicyCount,
      totalClaims: claimsAggregate.total,
      claimsByStatus: Object.fromEntries(
        Object.entries(claimsAggregate.byStatus).map(([status, v]) => [
          status,
          v.count,
        ]),
      ),
      recentClaims: recentClaims.map((row) => ({
        claimId: row.claim_id,
        claimNumber: row.claim_number,
        claimAmount: row.claim_amount,
        claimStatus: row.claim_status,
        claimDate: row.claim_date,
      })),
    };
  }

  // =====================================================
  // Claims — every claim routed to this provider (via
  // healthcare_claims -> member_insurance -> insurance_plans), with the
  // ability to approve/reject one. healthcare_claims itself is frozen —
  // the Hospital role that used to file/submit claims has been removed
  // — so this is a review-only surface over existing rows, implementing
  // the Insurance role's long-seeded but previously unused
  // `claims:review` permission.
  // =====================================================

  async listClaims(userId: number, status?: string) {
    const providerId = await this.getAssignedProviderId(userId);

    const rows = await this.dataSource.query<ClaimRow[]>(
      `SELECT hc.claim_id, hc.claim_number, hc.claim_amount, hc.approved_amount,
              hc.claim_status, hc.claim_date, hc.processed_date, hc.remarks,
              hc.member_id, h.hospital_name
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       LEFT JOIN hospitals h ON h.hospital_id = hc.hospital_id
       WHERE ip.provider_id = $1
         AND ($2::text IS NULL OR hc.claim_status = $2)
       ORDER BY hc.claim_date DESC`,
      [providerId, status ?? null],
    );

    return rows.map((row) => ({
      claimId: row.claim_id,
      claimNumber: row.claim_number,
      claimAmount: row.claim_amount,
      approvedAmount: row.approved_amount,
      claimStatus: row.claim_status,
      claimDate: row.claim_date,
      processedDate: row.processed_date,
      remarks: row.remarks,
      memberId: row.member_id,
      hospitalName: row.hospital_name,
    }));
  }

  async updateClaimStatus(
    userId: number,
    claimId: number,
    dto: UpdateClaimStatusDto,
    ipAddress: string | null = null,
  ) {
    const providerId = await this.getAssignedProviderId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [claim] = await manager.query<
        { claim_id: number; claim_status: string; claim_amount: string }[]
      >(
        `SELECT hc.claim_id, hc.claim_status, hc.claim_amount
         FROM healthcare_claims hc
         JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
         JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
         WHERE hc.claim_id = $1 AND ip.provider_id = $2`,
        [claimId, providerId],
      );

      if (!claim) {
        throw new NotFoundException(
          'Claim not found or not routed to your provider',
        );
      }

      const approvedAmount =
        dto.claimStatus === 'Approved'
          ? (dto.approvedAmount ?? Number(claim.claim_amount))
          : null;

      // manager.query() on an UPDATE ... RETURNING (unlike a plain SELECT)
      // resolves to [rows, affectedRowCount] under this TypeORM version —
      // destructure the inner rows array to get the single updated row.
      const [[updated]] = await manager.query<[ClaimRow[], number]>(
        `UPDATE healthcare_claims
         SET claim_status = $2, approved_amount = $3, processed_date = NOW(),
             remarks = COALESCE($4, remarks)
         WHERE claim_id = $1
         RETURNING claim_id, claim_number, claim_amount, approved_amount,
                   claim_status, claim_date, processed_date, remarks, member_id`,
        [claimId, dto.claimStatus, approvedAmount, dto.remarks ?? null],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'insurance.claim_status_change',
        affectedTable: 'healthcare_claims',
        affectedRecordId: claimId,
        oldValue: { claimStatus: claim.claim_status },
        newValue: { claimStatus: dto.claimStatus, approvedAmount },
        ipAddress,
      });

      return {
        claimId: updated.claim_id,
        claimNumber: updated.claim_number,
        claimAmount: updated.claim_amount,
        approvedAmount: updated.approved_amount,
        claimStatus: updated.claim_status,
        claimDate: updated.claim_date,
        processedDate: updated.processed_date,
        remarks: updated.remarks,
        memberId: updated.member_id,
      };
    });
  }

  // =====================================================
  // Settlements — allocations this provider has received from a bank's
  // pooled Health Fund, traceable back to the underlying contributions
  // via the same `settlements` table Bank writes
  // (counterparty_type = 'Insurance'). Read-only for Insurance, same as
  // Hospital's old read-only view of its own payments.
  // =====================================================

  async listSettlements(userId: number, status?: string) {
    const providerId = await this.getAssignedProviderId(userId);

    return this.dataSource.query<SettlementRow[]>(
      `SELECT settlement_id, counterparty_name, amount, settlement_status, settlement_date
       FROM settlements
       WHERE counterparty_type = 'Insurance' AND insurance_provider_id = $1
         AND ($2::text IS NULL OR settlement_status = $2)
       ORDER BY settlement_date DESC`,
      [providerId, status ?? null],
    );
  }

  // =====================================================
  // Allocations — per-contribution traceability (insurance_allocations),
  // distinct from the pooled settlements above. Answers "where did this
  // specific member's specific contribution go?" — settlements answer
  // "how much has the bank paid this provider in aggregate?"
  // =====================================================

  // Filterable (status/channel/date range), paginated allocation list
  // backing the Insurance dashboard's transaction table. Deliberately
  // exposes memberId only — not the member's name or any other PII —
  // since nothing on this list requires identifying who the member is
  // by name; a member's own identity is already on file wherever this
  // provider manages its policyholders (member_insurance/policy_number),
  // not something this reconciliation-facing list needs to repeat.
  async listAllocations(
    userId: number,
    filters: AllocationListFilters,
    page: number,
    pageSize: number,
  ) {
    const providerId = await this.getAssignedProviderId(userId);

    const params = [
      providerId,
      filters.status ?? null,
      filters.channel ?? null,
      filters.dateFrom ?? null,
      filters.dateTo ?? null,
    ];

    const whereClause = `
      ia.insurance_provider_id = $1
      AND ($2::text IS NULL OR ia.allocation_status = $2)
      AND (
        $3::text IS NULL
        OR ($3 = 'AIRTIME' AND wt.contribution_id IS NOT NULL)
        OR ($3 = 'BANK_TRANSFER' AND wt.bank_transaction_id IS NOT NULL)
      )
      AND ($4::timestamp IS NULL OR ia.created_at >= $4::timestamp)
      AND ($5::timestamp IS NULL OR ia.created_at <= $5::timestamp)
    `;

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
       WHERE ${whereClause}`,
      params,
    );

    const items = await this.dataSource.query<
      {
        allocation_id: number;
        member_id: number;
        amount: string;
        currency: string;
        allocation_status: string;
        allocation_reference: string | null;
        created_at: Date;
        completed_at: Date | null;
        channel: 'AIRTIME' | 'BANK_TRANSFER';
        contribution_id: number | null;
        bank_transaction_id: number | null;
        contribution_reference: string | null;
      }[]
    >(
      `SELECT ia.allocation_id, ia.member_id, ia.amount, ia.currency, ia.allocation_status,
              ia.allocation_reference, ia.created_at, ia.completed_at,
              CASE WHEN wt.contribution_id IS NOT NULL THEN 'AIRTIME'
                   ELSE 'BANK_TRANSFER' END AS channel,
              wt.contribution_id, wt.bank_transaction_id,
              COALESCE(tc.reference_number, bt.transaction_reference) AS contribution_reference
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
       LEFT JOIN telecom_contributions tc ON tc.contribution_id = wt.contribution_id
       LEFT JOIN bank_transactions bt ON bt.bank_transaction_id = wt.bank_transaction_id
       WHERE ${whereClause}
       ORDER BY ia.created_at DESC
       LIMIT $6 OFFSET $7`,
      [...params, pageSize, (page - 1) * pageSize],
    );

    const [totals] = await this.dataSource.query<{ total_allocated: string }[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_allocated
       FROM insurance_allocations
       WHERE insurance_provider_id = $1 AND allocation_status = 'Allocated'`,
      [providerId],
    );

    return {
      items: items.map((row) => ({
        allocationId: row.allocation_id,
        memberId: row.member_id,
        amount: row.amount,
        currency: row.currency,
        allocationStatus: row.allocation_status,
        allocationReference: row.allocation_reference,
        contributionReference: row.contribution_reference,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        channel: row.channel,
        contributionId: row.contribution_id,
        bankTransactionId: row.bank_transaction_id,
      })),
      total,
      totalAllocated: Number(totals?.total_allocated ?? 0),
      page,
      pageSize,
    };
  }

  // =====================================================
  // Contribution & allocation summary — the stat-card row on the
  // Insurance dashboard. "Total allocated contributions" is every
  // contribution ever routed to this provider (any status, the full
  // volume attempted); pending/completed/failed/reversed is that same
  // total's 4-way breakdown by insurance_allocations.allocation_status;
  // telecom/bank contributions is the same total split by channel
  // instead. Every number comes from insurance_allocations joined to
  // wallet_transactions — the same two tables listAllocations() reads —
  // never a separate/duplicated aggregate table.
  // =====================================================

  async getContributionsSummary(userId: number) {
    const providerId = await this.getAssignedProviderId(userId);
    return this.getContributionsAggregate(providerId);
  }

  // The actual query behind getContributionsSummary() — extracted so
  // getDashboardSummary() below can reuse it (same providerId already
  // resolved once) instead of re-deriving the identical aggregate.
  private async getContributionsAggregate(providerId: number) {
    const [row] = await this.dataSource.query<
      {
        total_count: number;
        total_amount: string;
        pending_count: number;
        pending_amount: string;
        completed_count: number;
        completed_amount: string;
        failed_count: number;
        failed_amount: string;
        reversed_count: number;
        reversed_amount: string;
        telecom_count: number;
        telecom_amount: string;
        bank_count: number;
        bank_amount: string;
      }[]
    >(
      `SELECT
         COUNT(*)::int AS total_count,
         COALESCE(SUM(ia.amount), 0) AS total_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status IN ('Pending', 'Processing'))::int AS pending_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status IN ('Pending', 'Processing')), 0) AS pending_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status = 'Allocated')::int AS completed_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status = 'Allocated'), 0) AS completed_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status = 'Failed')::int AS failed_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status = 'Failed'), 0) AS failed_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status = 'Reversed')::int AS reversed_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status = 'Reversed'), 0) AS reversed_amount,
         COUNT(*) FILTER (WHERE wt.contribution_id IS NOT NULL)::int AS telecom_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE wt.contribution_id IS NOT NULL), 0) AS telecom_amount,
         COUNT(*) FILTER (WHERE wt.bank_transaction_id IS NOT NULL)::int AS bank_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE wt.bank_transaction_id IS NOT NULL), 0) AS bank_amount
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
       WHERE ia.insurance_provider_id = $1`,
      [providerId],
    );

    return {
      totalAllocatedContributions: {
        count: row.total_count,
        amount: Number(row.total_amount),
      },
      pendingAllocations: {
        count: row.pending_count,
        amount: Number(row.pending_amount),
      },
      completedAllocations: {
        count: row.completed_count,
        amount: Number(row.completed_amount),
      },
      failedAllocations: {
        count: row.failed_count,
        amount: Number(row.failed_amount),
      },
      reversedAllocations: {
        count: row.reversed_count,
        amount: Number(row.reversed_amount),
      },
      telecomContributions: {
        count: row.telecom_count,
        amount: Number(row.telecom_amount),
      },
      bankContributions: {
        count: row.bank_count,
        amount: Number(row.bank_amount),
      },
    };
  }

  // =====================================================
  // GET /insurance/dashboard/summary — the single consolidated payload
  // the Insurance Dashboard page is built on. Deliberately reuses
  // getContributionsAggregate() and getClaimsAggregate() rather than
  // re-deriving those numbers a second time, and adds the pieces
  // neither of the narrower existing endpoints (GET /insurance/dashboard,
  // GET /insurance/contributions/summary) computes on its own: the
  // per-operator/per-bank contribution breakdown, member coverage,
  // available funds, and a real cross-table recent-activity feed. Every
  // figure is scoped to this caller's own insurance_provider_id — same
  // tenant boundary as every other method in this service.
  // =====================================================

  async getDashboardSummary(userId: number) {
    const providerId = await this.getAssignedProviderId(userId);

    const [
      provider,
      contributions,
      operatorBreakdown,
      bankBreakdown,
      latestAllocations,
      memberCoverage,
      claims,
      settledAmount,
      recentActivity,
    ] = await Promise.all([
      this.dataSource
        .query<{ provider_name: string; status: string }[]>(
          `SELECT provider_name, status FROM insurance_providers WHERE provider_id = $1`,
          [providerId],
        )
        .then(([row]) => row),
      this.getContributionsAggregate(providerId),
      this.getOperatorContributionBreakdown(providerId),
      this.getBankContributionBreakdown(providerId),
      this.getLatestAllocations(providerId),
      this.getMemberCoverage(providerId),
      this.getClaimsAggregate(providerId),
      this.getSettledAmount(providerId),
      this.getRecentActivity(providerId),
    ]);

    // Money this provider has been allocated but not yet paid out
    // against approved claims — a computed logical balance (Insurance
    // has no dedicated fund-ledger table the way Bank's
    // bank_fund_accounts does), never negative in the response even if
    // approved claims theoretically exceed what was allocated.
    const availableFunds = Math.max(
      0,
      contributions.completedAllocations.amount - claims.approvedAmount,
    );

    return {
      provider: {
        name: provider?.provider_name ?? null,
        status: provider?.status ?? null,
      },
      contributions: {
        total: contributions.totalAllocatedContributions.amount,
        totalCount: contributions.totalAllocatedContributions.count,
        airtime: contributions.telecomContributions.amount,
        airtimeCount: contributions.telecomContributions.count,
        bankTransfer: contributions.bankContributions.amount,
        bankTransferCount: contributions.bankContributions.count,
        byOperator: operatorBreakdown,
        byBank: bankBreakdown,
      },
      allocations: {
        totalCollected: contributions.totalAllocatedContributions.amount,
        totalAllocated: contributions.completedAllocations.amount,
        pending: contributions.pendingAllocations.amount,
        failed: contributions.failedAllocations.amount,
        reversed: contributions.reversedAllocations.amount,
        recordCount: contributions.totalAllocatedContributions.count,
        latest: latestAllocations,
      },
      members: memberCoverage,
      claims: {
        total: claims.total,
        pending: claims.pending,
        approved: claims.approved,
        rejected: claims.rejected,
        claimedAmount: claims.claimedAmount,
        approvedAmount: claims.approvedAmount,
        // Sourced from the settlements table (Bank -> Insurance payout),
        // not from healthcare_claims — there is no claim-level "Settled"
        // status in the current workflow (see getClaimsAggregate's note).
        // This is the real money this provider has actually received.
        settledAmount,
      },
      availableFunds,
      recentActivity,
    };
  }

  private async getOperatorContributionBreakdown(providerId: number) {
    const rows = await this.dataSource.query<
      { operator_name: string; count: number; amount: string }[]
    >(
      `SELECT top.operator_name, COUNT(*)::int AS count, COALESCE(SUM(ia.amount), 0) AS amount
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id AND wt.contribution_id IS NOT NULL
       JOIN telecom_contributions tc ON tc.contribution_id = wt.contribution_id
       JOIN telecom_operators top ON top.operator_id = tc.operator_id
       WHERE ia.insurance_provider_id = $1
       GROUP BY top.operator_name
       ORDER BY amount DESC`,
      [providerId],
    );

    return rows.map((row) => ({
      operatorName: row.operator_name,
      count: row.count,
      amount: Number(row.amount),
    }));
  }

  private async getBankContributionBreakdown(providerId: number) {
    const rows = await this.dataSource.query<
      { bank_name: string; count: number; amount: string }[]
    >(
      `SELECT b.bank_name, COUNT(*)::int AS count, COALESCE(SUM(ia.amount), 0) AS amount
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id AND wt.bank_transaction_id IS NOT NULL
       JOIN bank_transactions bt ON bt.bank_transaction_id = wt.bank_transaction_id
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       JOIN banks b ON b.bank_id = mba.bank_id
       WHERE ia.insurance_provider_id = $1
       GROUP BY b.bank_name
       ORDER BY amount DESC`,
      [providerId],
    );

    return rows.map((row) => ({
      bankName: row.bank_name,
      count: row.count,
      amount: Number(row.amount),
    }));
  }

  private async getLatestAllocations(providerId: number) {
    const rows = await this.dataSource.query<
      {
        allocation_id: number;
        amount: string;
        allocation_status: string;
        allocation_reference: string | null;
        created_at: Date;
        contribution_reference: string | null;
        channel: 'AIRTIME' | 'BANK_TRANSFER';
      }[]
    >(
      `SELECT ia.allocation_id, ia.amount, ia.allocation_status, ia.allocation_reference, ia.created_at,
              COALESCE(tc.reference_number, bt.transaction_reference) AS contribution_reference,
              CASE WHEN wt.contribution_id IS NOT NULL THEN 'AIRTIME' ELSE 'BANK_TRANSFER' END AS channel
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
       LEFT JOIN telecom_contributions tc ON tc.contribution_id = wt.contribution_id
       LEFT JOIN bank_transactions bt ON bt.bank_transaction_id = wt.bank_transaction_id
       WHERE ia.insurance_provider_id = $1
       ORDER BY ia.created_at DESC
       LIMIT 5`,
      [providerId],
    );

    return rows.map((row) => ({
      allocationId: row.allocation_id,
      amount: Number(row.amount),
      status: row.allocation_status,
      allocationReference: row.allocation_reference,
      contributionReference: row.contribution_reference,
      channel: row.channel,
      createdAt: row.created_at,
    }));
  }

  // Real money this provider has actually received, sourced from the
  // existing settlements table (Bank -> Insurance payout pipeline
  // listSettlements()/getReports() already read) — not fabricated, and
  // not the same thing as an individual claim reaching a "Settled"
  // status, which this codebase's claim workflow doesn't implement.
  private async getSettledAmount(providerId: number): Promise<number> {
    const [row] = await this.dataSource.query<{ total: string }[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM settlements
       WHERE counterparty_type = 'Insurance' AND insurance_provider_id = $1
         AND settlement_status = 'Completed'`,
      [providerId],
    );
    return Number(row?.total ?? 0);
  }

  // Member coverage, scoped to THIS provider's own policyholder base
  // (member_insurance -> insurance_plans WHERE provider_id = $1) — not
  // a system-wide member count, consistent with every other number on
  // this dashboard being tenant-scoped. "Eligible" is the one
  // deliberately system-wide figure: verified TUJITUNZE members
  // (member_status='Active', Member role) who do not currently hold an
  // active policy with this provider — i.e. this provider's addressable
  // market, not a PII listing, just a count.
  private async getMemberCoverage(providerId: number) {
    const [coverageRow] = await this.dataSource.query<
      { total: number; active: number }[]
    >(
      `SELECT COUNT(DISTINCT mi.member_id)::int AS total,
              COUNT(DISTINCT mi.member_id) FILTER (WHERE mi.policy_status = 'Active')::int AS active
       FROM member_insurance mi
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1`,
      [providerId],
    );

    const [eligibleRow] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(DISTINCT u.user_id)::int AS count
       FROM users u
       JOIN member_roles mr ON mr.member_id = u.user_id
       JOIN roles r ON r.role_id = mr.role_id AND r.role_name = 'Member'
       WHERE u.member_status = 'Active'
         AND NOT EXISTS (
           SELECT 1 FROM member_insurance mi2
           JOIN insurance_plans ip2 ON ip2.plan_id = mi2.plan_id
           WHERE mi2.member_id = u.user_id
             AND ip2.provider_id = $1
             AND mi2.policy_status = 'Active'
         )`,
      [providerId],
    );

    return {
      total: coverageRow?.total ?? 0,
      active: coverageRow?.active ?? 0,
      inactive: (coverageRow?.total ?? 0) - (coverageRow?.active ?? 0),
      eligible: eligibleRow?.count ?? 0,
      covered: coverageRow?.active ?? 0,
    };
  }

  // Real, provider-scoped activity feed — every row is an actual
  // audit_logs entry this provider's own data produced (contribution ->
  // allocation -> claim decision -> settlement), joined back to
  // insurance_allocations/healthcare_claims/settlements to prove it
  // belongs to THIS provider rather than showing every audit_logs row
  // in the system. Nothing here is synthesized.
  private async getRecentActivity(providerId: number) {
    const rows = await this.dataSource.query<
      {
        audit_id: number;
        action_type: string;
        affected_table: string | null;
        affected_record_id: number | null;
        new_value: Record<string, unknown> | null;
        created_at: Date;
      }[]
    >(
      `SELECT al.audit_id, al.action_type, al.affected_table, al.affected_record_id, al.new_value, al.created_at
       FROM audit_logs al
       WHERE (
         al.affected_table = 'insurance_allocations' AND al.affected_record_id IN (
           SELECT allocation_id FROM insurance_allocations WHERE insurance_provider_id = $1
         )
       ) OR (
         al.affected_table = 'healthcare_claims' AND al.affected_record_id IN (
           SELECT hc.claim_id FROM healthcare_claims hc
           JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
           JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
           WHERE ip.provider_id = $1
         )
       ) OR (
         al.affected_table = 'settlements' AND al.affected_record_id IN (
           SELECT settlement_id FROM settlements
           WHERE counterparty_type = 'Insurance' AND insurance_provider_id = $1
         )
       ) OR (
         al.affected_table IN ('telecom_contributions', 'bank_transactions') AND EXISTS (
           SELECT 1 FROM wallet_transactions wt
           JOIN insurance_allocations ia ON ia.wallet_transaction_id = wt.wallet_transaction_id
           WHERE ia.insurance_provider_id = $1
             AND (
               (al.affected_table = 'telecom_contributions' AND wt.contribution_id = al.affected_record_id)
               OR (al.affected_table = 'bank_transactions' AND wt.bank_transaction_id = al.affected_record_id)
             )
         )
       )
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [providerId],
    );

    return rows.map((row) => ({
      auditId: row.audit_id,
      type: this.describeActivity(row.action_type, row.new_value),
      actionType: row.action_type,
      createdAt: row.created_at,
    }));
  }

  private describeActivity(
    actionType: string,
    newValue: Record<string, unknown> | null,
  ): string {
    switch (actionType) {
      case 'telecom.contribution_record':
      case 'telecom.webhook_contribution':
      case 'bank.contribution_record':
      case 'bank.webhook_transaction':
        return 'New contribution';
      case 'insurance.allocation_create':
        return 'Insurance allocation';
      case 'insurance.allocation_fail':
        return 'Insurance allocation failed';
      case 'insurance.allocation_reverse':
        return 'Allocation reversed';
      case 'insurance.claim_status_change':
        return newValue?.claimStatus === 'Approved'
          ? 'Claim approved'
          : newValue?.claimStatus === 'Rejected'
            ? 'Claim rejected'
            : 'Claim status changed';
      case 'bank.settlement_complete':
        return 'Settlement completed';
      default:
        return actionType;
    }
  }

  // Full chain traceability for one allocation — literally what
  // CLAUDE.md's STEP 6 example describes: Member -> Telecom/Bank
  // transaction -> Contribution -> Allocation -> Insurance Company. Joins
  // through wallet_transactions to whichever channel table actually
  // produced this contribution (never both), rather than storing a
  // redundant contribution_id/bank_transaction_id directly on
  // insurance_allocations.
  async getAllocationTrace(userId: number, allocationId: number) {
    const providerId = await this.getAssignedProviderId(userId);

    const [row] = await this.dataSource.query<
      {
        allocation_id: number;
        allocation_reference: string | null;
        allocation_status: string;
        amount: string;
        currency: string;
        created_at: Date;
        completed_at: Date | null;
        member_id: number;
        first_name: string;
        surname: string;
        provider_id: number;
        provider_name: string;
        wallet_transaction_id: number;
        contribution_id: number | null;
        bank_transaction_id: number | null;
        telecom_external_reference: string | null;
        telecom_internal_reference: string | null;
        telecom_status: string | null;
        telecom_source: string | null;
        bank_external_reference: string | null;
        bank_internal_reference: string | null;
        bank_status: string | null;
      }[]
    >(
      `SELECT ia.allocation_id, ia.allocation_reference, ia.allocation_status,
              ia.amount, ia.currency, ia.created_at, ia.completed_at,
              ia.member_id, u.first_name, u.surname,
              prov.provider_id, prov.provider_name,
              wt.wallet_transaction_id, wt.contribution_id, wt.bank_transaction_id,
              tc.reference_number AS telecom_external_reference,
              tc.internal_reference AS telecom_internal_reference,
              tc.processing_status AS telecom_status,
              tc.contribution_source AS telecom_source,
              bt.transaction_reference AS bank_external_reference,
              bt.internal_reference AS bank_internal_reference,
              bt.transaction_status AS bank_status
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
       JOIN users u ON u.user_id = ia.member_id
       JOIN insurance_providers prov ON prov.provider_id = ia.insurance_provider_id
       LEFT JOIN telecom_contributions tc ON tc.contribution_id = wt.contribution_id
       LEFT JOIN bank_transactions bt ON bt.bank_transaction_id = wt.bank_transaction_id
       WHERE ia.allocation_id = $1 AND ia.insurance_provider_id = $2`,
      [allocationId, providerId],
    );

    if (!row) {
      throw new NotFoundException(
        'Allocation not found for your insurance provider',
      );
    }

    const channel: 'AIRTIME' | 'BANK_TRANSFER' = row.contribution_id
      ? 'AIRTIME'
      : 'BANK_TRANSFER';

    return {
      member: {
        memberId: row.member_id,
        memberName: `${row.first_name} ${row.surname}`,
      },
      channel,
      contribution: {
        contributionId: row.contribution_id,
        bankTransactionId: row.bank_transaction_id,
        externalReference:
          channel === 'AIRTIME'
            ? row.telecom_external_reference
            : row.bank_external_reference,
        internalReference:
          channel === 'AIRTIME'
            ? row.telecom_internal_reference
            : row.bank_internal_reference,
        status: channel === 'AIRTIME' ? row.telecom_status : row.bank_status,
        source: channel === 'AIRTIME' ? row.telecom_source : 'Bank Transfer',
      },
      walletTransactionId: row.wallet_transaction_id,
      allocation: {
        allocationId: row.allocation_id,
        allocationReference: row.allocation_reference,
        amount: row.amount,
        currency: row.currency,
        status: row.allocation_status,
        createdAt: row.created_at,
        completedAt: row.completed_at,
      },
      insuranceProvider: {
        providerId: row.provider_id,
        providerName: row.provider_name,
      },
    };
  }

  // =====================================================
  // Reports — period-bucketed view of settlements received, same shape
  // as Telecom's GET /telecom/reports.
  // =====================================================

  async getReports(userId: number, period: 'daily' | 'weekly' | 'monthly') {
    const providerId = await this.getAssignedProviderId(userId);

    const truncUnit =
      period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const buckets = await this.dataSource.query<
      { bucket: Date; count: number; total: string }[]
    >(
      `SELECT date_trunc($2, settlement_date) AS bucket,
              COUNT(*)::int AS count,
              COALESCE(SUM(amount), 0) AS total
       FROM settlements
       WHERE counterparty_type = 'Insurance' AND insurance_provider_id = $1
       GROUP BY bucket
       ORDER BY bucket DESC
       LIMIT 12`,
      [providerId, truncUnit],
    );

    const byStatus = await this.dataSource.query<
      { settlement_status: string; count: number; total: string }[]
    >(
      `SELECT settlement_status, COUNT(*)::int AS count,
              COALESCE(SUM(amount), 0) AS total
       FROM settlements
       WHERE counterparty_type = 'Insurance' AND insurance_provider_id = $1
       GROUP BY settlement_status`,
      [providerId],
    );

    return {
      period,
      buckets: buckets.map((row) => ({
        bucket: row.bucket,
        count: row.count,
        total: row.total,
      })),
      byStatus: Object.fromEntries(
        byStatus.map((row) => [
          row.settlement_status,
          { count: row.count, total: row.total },
        ]),
      ),
    };
  }

  private async getAssignedProviderId(userId: number): Promise<number> {
    const [row] = await this.dataSource.query<
      { insurance_provider_id: number | null }[]
    >(`SELECT insurance_provider_id FROM users WHERE user_id = $1`, [userId]);

    if (!row?.insurance_provider_id) {
      throw new ForbiddenException(
        'This account is not assigned to an insurance provider yet',
      );
    }

    return row.insurance_provider_id;
  }
}
