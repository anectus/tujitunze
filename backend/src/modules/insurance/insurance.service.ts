import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';

interface ClaimStatusCountRow {
  claim_status: string;
  count: number;
}

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

@Injectable()
export class InsuranceService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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

    const claimsByStatus = await this.dataSource.query<ClaimStatusCountRow[]>(
      `SELECT hc.claim_status, COUNT(*)::int AS count
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       GROUP BY hc.claim_status`,
      [providerId],
    );

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
      totalClaims: claimsByStatus.reduce((sum, row) => sum + row.count, 0),
      claimsByStatus: Object.fromEntries(
        claimsByStatus.map((row) => [row.claim_status, row.count]),
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

  async listAllocations(
    userId: number,
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const providerId = await this.getAssignedProviderId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM insurance_allocations
       WHERE insurance_provider_id = $1 AND ($2::text IS NULL OR allocation_status = $2)`,
      [providerId, status ?? null],
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
        channel: 'AIRTIME' | 'BANK_TRANSFER' | 'WALLET_TOPUP';
        contribution_id: number | null;
        bank_transaction_id: number | null;
        first_name: string;
        surname: string;
      }[]
    >(
      `SELECT ia.allocation_id, ia.member_id, ia.amount, ia.currency, ia.allocation_status,
              ia.allocation_reference, ia.created_at, ia.completed_at,
              CASE WHEN wt.contribution_id IS NOT NULL THEN 'AIRTIME'
                   WHEN wt.bank_transaction_id IS NOT NULL THEN 'BANK_TRANSFER'
                   ELSE 'WALLET_TOPUP' END AS channel,
              wt.contribution_id, wt.bank_transaction_id,
              u.first_name, u.surname
       FROM insurance_allocations ia
       JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
       JOIN users u ON u.user_id = ia.member_id
       WHERE ia.insurance_provider_id = $1 AND ($2::text IS NULL OR ia.allocation_status = $2)
       ORDER BY ia.created_at DESC
       LIMIT $3 OFFSET $4`,
      [providerId, status ?? null, pageSize, (page - 1) * pageSize],
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
        memberName: `${row.first_name} ${row.surname}`,
        amount: row.amount,
        currency: row.currency,
        allocationStatus: row.allocation_status,
        allocationReference: row.allocation_reference,
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
