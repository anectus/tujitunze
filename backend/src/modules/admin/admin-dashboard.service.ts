import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface MemberStatusCountRow {
  member_status: string;
  count: number;
}

interface ChannelStatusRow {
  status: string;
  count: number;
  total: string;
}

export interface FinancialReportFilters {
  dateFrom?: string;
  dateTo?: string;
  memberId?: number;
  operatorId?: number;
  bankId?: number;
  channel?: 'AIRTIME' | 'BANK_TRANSFER';
  status?: string;
  insuranceProviderId?: number;
  reference?: string;
}

// The single cross-channel view every STEP 9 report/list query is built
// on: AIRTIME (telecom_contributions) and BANK_TRANSFER (bank_transactions
// where transaction_type='Contribution') normalized into one shape via
// UNION ALL — same "reuse, don't duplicate the ledger" approach
// getContributionsSummary()/listContributions() already established —
// plus the two joins STEP 9 adds on top: insurance_allocations (via
// wallet_transactions, exactly as InsuranceService.getAllocationTrace()
// already joins it) and admin_reconciliation_records (STEP 7) to know
// whether a transaction has ever actually been reconciled.
const FINANCIAL_COMBINED_CTE = `
  combined AS (
    SELECT 'AIRTIME'::text AS channel, tc.contribution_id AS source_id, tc.member_id,
           u.first_name, u.surname, tc.contribution_amount AS amount,
           tc.processing_status AS status, tc.reference_number AS reference,
           tc.internal_reference AS internal_reference, tc.contribution_date AS occurred_at,
           top.operator_name AS source_name, tc.operator_id AS operator_id,
           NULL::int AS bank_id, wt.wallet_transaction_id AS wallet_transaction_id
    FROM telecom_contributions tc
    JOIN users u ON u.user_id = tc.member_id
    JOIN telecom_operators top ON top.operator_id = tc.operator_id
    LEFT JOIN wallet_transactions wt ON wt.contribution_id = tc.contribution_id

    UNION ALL

    SELECT 'BANK_TRANSFER'::text AS channel, bt.bank_transaction_id AS source_id, mba.member_id,
           u.first_name, u.surname, bt.amount,
           bt.transaction_status AS status, bt.transaction_reference AS reference,
           bt.internal_reference AS internal_reference, bt.transaction_date AS occurred_at,
           b.bank_name AS source_name, NULL::int AS operator_id,
           b.bank_id AS bank_id, wt.wallet_transaction_id AS wallet_transaction_id
    FROM bank_transactions bt
    JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
    JOIN users u ON u.user_id = mba.member_id
    JOIN banks b ON b.bank_id = mba.bank_id
    LEFT JOIN wallet_transactions wt ON wt.bank_transaction_id = bt.bank_transaction_id
    WHERE bt.transaction_type = 'Contribution'
  )
`;

// $1-$9 in that exact order, reused verbatim by both getFinancialReport()
// and listFinancialTransactions() so the two can never drift out of sync
// on what a given filter set actually means. NULL means "not filtered".
const FINANCIAL_FILTER_WHERE = `
  ($1::timestamp IS NULL OR c.occurred_at >= $1::timestamp)
  AND ($2::timestamp IS NULL OR c.occurred_at <= $2::timestamp)
  AND ($3::int IS NULL OR c.member_id = $3::int)
  AND ($4::int IS NULL OR c.operator_id = $4::int)
  AND ($5::int IS NULL OR c.bank_id = $5::int)
  AND ($6::text IS NULL OR c.channel = $6::text)
  AND ($7::text IS NULL OR c.status = $7::text)
  AND ($8::int IS NULL OR ia.insurance_provider_id = $8::int)
  AND (
    $9::text IS NULL
    OR c.reference ILIKE '%' || $9::text || '%'
    OR c.internal_reference ILIKE '%' || $9::text || '%'
  )
`;

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private filterParams(filters: FinancialReportFilters): unknown[] {
    return [
      filters.dateFrom ?? null,
      filters.dateTo ?? null,
      filters.memberId ?? null,
      filters.operatorId ?? null,
      filters.bankId ?? null,
      filters.channel ?? null,
      filters.status ?? null,
      filters.insuranceProviderId ?? null,
      filters.reference ?? null,
    ];
  }

  async getDashboard() {
    const [membersByStatus, recentAuditLogCount] = await Promise.all([
      this.dataSource.query<MemberStatusCountRow[]>(
        `SELECT member_status, COUNT(*)::int AS count
         FROM users
         GROUP BY member_status`,
      ),
      this.auditLogsService.countRecent(24),
    ]);

    return {
      membersByStatus: Object.fromEntries(
        membersByStatus.map((row) => [row.member_status, row.count]),
      ),
      recentAuditLogCount,
    };
  }

  // Unified cross-channel view CLAUDE.md's collection model calls for:
  // AIRTIME (telecom_contributions, written by
  // TelecomService.recordContribution) and BANK_TRANSFER
  // (bank_transactions where transaction_type='Contribution', written by
  // BankService.recordContribution) broken down by status, plus what's
  // actually made it to an Insurance company via the existing
  // settlements pipeline. Reuses those three tables directly rather than
  // introducing a separate summary/materialized table.
  async getContributionsSummary() {
    const [airtimeByStatus, bankTransferByStatus, allocatedRow] =
      await Promise.all([
        this.dataSource.query<ChannelStatusRow[]>(
          `SELECT processing_status AS status, COUNT(*)::int AS count,
                  COALESCE(SUM(contribution_amount), 0) AS total
           FROM telecom_contributions
           GROUP BY processing_status`,
        ),
        this.dataSource.query<ChannelStatusRow[]>(
          `SELECT transaction_status AS status, COUNT(*)::int AS count,
                  COALESCE(SUM(amount), 0) AS total
           FROM bank_transactions
           WHERE transaction_type = 'Contribution'
           GROUP BY transaction_status`,
        ),
        this.dataSource.query<{ total: string }[]>(
          `SELECT COALESCE(SUM(amount), 0) AS total
           FROM settlements
           WHERE counterparty_type = 'Insurance' AND settlement_status = 'Completed'`,
        ),
      ]);

    const sumTotals = (rows: ChannelStatusRow[]) =>
      rows.reduce((sum, row) => sum + Number(row.total), 0);

    const byInsuranceProvider = await this.dataSource.query<
      {
        provider_id: number;
        provider_name: string;
        count: number;
        total: string;
      }[]
    >(
      `SELECT ip.provider_id, ip.provider_name, COUNT(ia.*)::int AS count,
              COALESCE(SUM(ia.amount), 0) AS total
       FROM insurance_allocations ia
       JOIN insurance_providers ip ON ip.provider_id = ia.insurance_provider_id
       WHERE ia.allocation_status = 'Allocated'
       GROUP BY ip.provider_id, ip.provider_name
       ORDER BY total DESC`,
    );

    return {
      airtime: {
        byStatus: airtimeByStatus,
        total: sumTotals(airtimeByStatus),
      },
      bankTransfer: {
        byStatus: bankTransferByStatus,
        total: sumTotals(bankTransferByStatus),
      },
      totalCollected:
        sumTotals(airtimeByStatus) + sumTotals(bankTransferByStatus),
      totalAllocatedToInsurance: Number(allocatedRow[0]?.total ?? 0),
      byInsuranceProvider: byInsuranceProvider.map((row) => ({
        providerId: row.provider_id,
        providerName: row.provider_name,
        count: row.count,
        total: Number(row.total),
      })),
    };
  }

  // Real, filterable cross-channel list — both channel tables normalized
  // into one shape via UNION ALL rather than a new "contributions" table
  // (per the "reuse, don't duplicate the ledger" requirement). Backs a
  // real paginated admin view instead of only the aggregate summary
  // above.
  async listContributions(
    channel: 'AIRTIME' | 'BANK_TRANSFER' | undefined,
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const rows = await this.dataSource.query<
      {
        channel: 'AIRTIME' | 'BANK_TRANSFER';
        source_id: number;
        member_id: number;
        first_name: string;
        surname: string;
        amount: string;
        status: string;
        reference: string | null;
        occurred_at: Date;
        source_name: string;
      }[]
    >(
      `SELECT * FROM (
         SELECT 'AIRTIME' AS channel, tc.contribution_id AS source_id, tc.member_id,
                u.first_name, u.surname, tc.contribution_amount AS amount,
                tc.processing_status AS status, tc.reference_number AS reference,
                tc.contribution_date AS occurred_at, top.operator_name AS source_name
         FROM telecom_contributions tc
         JOIN users u ON u.user_id = tc.member_id
         JOIN telecom_operators top ON top.operator_id = tc.operator_id

         UNION ALL

         SELECT 'BANK_TRANSFER' AS channel, bt.bank_transaction_id AS source_id, mba.member_id,
                u.first_name, u.surname, bt.amount,
                bt.transaction_status AS status, bt.transaction_reference AS reference,
                bt.transaction_date AS occurred_at, b.bank_name AS source_name
         FROM bank_transactions bt
         JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
         JOIN users u ON u.user_id = mba.member_id
         JOIN banks b ON b.bank_id = mba.bank_id
         WHERE bt.transaction_type = 'Contribution'
       ) combined
       WHERE ($1::text IS NULL OR channel = $1)
         AND ($2::text IS NULL OR status = $2)
       ORDER BY occurred_at DESC
       LIMIT $3 OFFSET $4`,
      [channel ?? null, status ?? null, pageSize, (page - 1) * pageSize],
    );

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT (
         (SELECT COUNT(*) FROM telecom_contributions tc
          WHERE ($1::text IS NULL OR $1 = 'AIRTIME')
            AND ($2::text IS NULL OR tc.processing_status = $2)) +
         (SELECT COUNT(*) FROM bank_transactions bt
          WHERE bt.transaction_type = 'Contribution'
            AND ($1::text IS NULL OR $1 = 'BANK_TRANSFER')
            AND ($2::text IS NULL OR bt.transaction_status = $2))
       )::int AS count`,
      [channel ?? null, status ?? null],
    );

    return {
      items: rows.map((row) => ({
        channel: row.channel,
        sourceId: row.source_id,
        memberId: row.member_id,
        memberName: `${row.first_name} ${row.surname}`,
        amount: row.amount,
        status: row.status,
        reference: row.reference,
        occurredAt: row.occurred_at,
        sourceName: row.source_name,
      })),
      total,
      page,
      pageSize,
    };
  }

  // =====================================================
  // STEP 9 — Admin financial reporting. Filterable by date range,
  // member, telecom operator, bank, channel, status, insurance company,
  // and transaction reference (FinancialReportFilters, all optional).
  // Built on the same telecom_contributions/bank_transactions tables as
  // listContributions() above, extended with the two joins STEP 9 needs:
  // insurance_allocations (for the insurance-company filter and the
  // pending/failed/reversed/total-allocated breakdown) and
  // admin_reconciliation_records (STEP 7) for "unreconciled" — a
  // transaction with no Matched reconciliation record on file, not a
  // fabricated/estimated figure.
  // =====================================================

  async getFinancialReport(filters: FinancialReportFilters) {
    const [row] = await this.dataSource.query<
      {
        total_count: number;
        total_amount: string;
        telecom_count: number;
        telecom_amount: string;
        bank_count: number;
        bank_amount: string;
        allocation_count: number;
        allocation_amount: string;
        pending_count: number;
        pending_amount: string;
        allocated_count: number;
        allocated_amount: string;
        failed_count: number;
        failed_amount: string;
        reversed_count: number;
        reversed_amount: string;
        unreconciled_count: number;
        unreconciled_amount: string;
      }[]
    >(
      `WITH ${FINANCIAL_COMBINED_CTE}
       SELECT
         COUNT(*)::int AS total_count,
         COALESCE(SUM(c.amount), 0) AS total_amount,
         COUNT(*) FILTER (WHERE c.channel = 'AIRTIME')::int AS telecom_count,
         COALESCE(SUM(c.amount) FILTER (WHERE c.channel = 'AIRTIME'), 0) AS telecom_amount,
         COUNT(*) FILTER (WHERE c.channel = 'BANK_TRANSFER')::int AS bank_count,
         COALESCE(SUM(c.amount) FILTER (WHERE c.channel = 'BANK_TRANSFER'), 0) AS bank_amount,
         COUNT(ia.allocation_id)::int AS allocation_count,
         COALESCE(SUM(ia.amount), 0) AS allocation_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status IN ('Pending', 'Processing'))::int AS pending_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status IN ('Pending', 'Processing')), 0) AS pending_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status = 'Allocated')::int AS allocated_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status = 'Allocated'), 0) AS allocated_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status = 'Failed')::int AS failed_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status = 'Failed'), 0) AS failed_amount,
         COUNT(*) FILTER (WHERE ia.allocation_status = 'Reversed')::int AS reversed_count,
         COALESCE(SUM(ia.amount) FILTER (WHERE ia.allocation_status = 'Reversed'), 0) AS reversed_amount,
         COUNT(*) FILTER (WHERE arr.record_id IS NULL)::int AS unreconciled_count,
         COALESCE(SUM(c.amount) FILTER (WHERE arr.record_id IS NULL), 0) AS unreconciled_amount
       FROM combined c
       LEFT JOIN insurance_allocations ia ON ia.wallet_transaction_id = c.wallet_transaction_id
       LEFT JOIN admin_reconciliation_records arr
         ON arr.channel = c.channel AND arr.external_reference = c.reference
            AND arr.reconciliation_status = 'Matched'
       WHERE ${FINANCIAL_FILTER_WHERE}`,
      this.filterParams(filters),
    );

    return {
      totalContributions: { count: row.total_count, amount: Number(row.total_amount) },
      telecomContributions: { count: row.telecom_count, amount: Number(row.telecom_amount) },
      bankContributions: { count: row.bank_count, amount: Number(row.bank_amount) },
      totalInsuranceAllocations: {
        count: row.allocation_count,
        amount: Number(row.allocation_amount),
      },
      allocated: { count: row.allocated_count, amount: Number(row.allocated_amount) },
      pending: { count: row.pending_count, amount: Number(row.pending_amount) },
      failed: { count: row.failed_count, amount: Number(row.failed_amount) },
      reversed: { count: row.reversed_count, amount: Number(row.reversed_amount) },
      unreconciled: {
        count: row.unreconciled_count,
        amount: Number(row.unreconciled_amount),
      },
    };
  }

  // Real, filterable, paginated transaction list backing the report
  // above — same filter set, same combined+joined shape, just SELECTing
  // rows instead of aggregating them.
  async listFinancialTransactions(
    filters: FinancialReportFilters,
    page: number,
    pageSize: number,
  ) {
    const params = this.filterParams(filters);

    const rows = await this.dataSource.query<
      {
        channel: 'AIRTIME' | 'BANK_TRANSFER';
        source_id: number;
        member_id: number;
        first_name: string;
        surname: string;
        amount: string;
        status: string;
        reference: string | null;
        internal_reference: string | null;
        occurred_at: Date;
        source_name: string;
        allocation_id: number | null;
        allocation_reference: string | null;
        allocation_status: string | null;
        allocation_amount: string | null;
        insurance_provider_id: number | null;
        reconciled: boolean;
      }[]
    >(
      `WITH ${FINANCIAL_COMBINED_CTE}
       SELECT c.channel, c.source_id, c.member_id, c.first_name, c.surname, c.amount,
              c.status, c.reference, c.internal_reference, c.occurred_at, c.source_name,
              ia.allocation_id, ia.allocation_reference, ia.allocation_status,
              ia.amount AS allocation_amount, ia.insurance_provider_id,
              (arr.record_id IS NOT NULL) AS reconciled
       FROM combined c
       LEFT JOIN insurance_allocations ia ON ia.wallet_transaction_id = c.wallet_transaction_id
       LEFT JOIN admin_reconciliation_records arr
         ON arr.channel = c.channel AND arr.external_reference = c.reference
            AND arr.reconciliation_status = 'Matched'
       WHERE ${FINANCIAL_FILTER_WHERE}
       ORDER BY c.occurred_at DESC
       LIMIT $10 OFFSET $11`,
      [...params, pageSize, (page - 1) * pageSize],
    );

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `WITH ${FINANCIAL_COMBINED_CTE}
       SELECT COUNT(*)::int AS count
       FROM combined c
       LEFT JOIN insurance_allocations ia ON ia.wallet_transaction_id = c.wallet_transaction_id
       LEFT JOIN admin_reconciliation_records arr
         ON arr.channel = c.channel AND arr.external_reference = c.reference
            AND arr.reconciliation_status = 'Matched'
       WHERE ${FINANCIAL_FILTER_WHERE}`,
      params,
    );

    return {
      items: rows.map((row) => ({
        channel: row.channel,
        sourceId: row.source_id,
        memberId: row.member_id,
        memberName: `${row.first_name} ${row.surname}`,
        amount: row.amount,
        status: row.status,
        contributionReference: row.reference,
        internalReference: row.internal_reference,
        occurredAt: row.occurred_at,
        sourceName: row.source_name,
        allocation: row.allocation_id
          ? {
              allocationId: row.allocation_id,
              allocationReference: row.allocation_reference,
              status: row.allocation_status,
              amount: row.allocation_amount,
              insuranceProviderId: row.insurance_provider_id,
            }
          : null,
        reconciled: row.reconciled,
      })),
      total,
      page,
      pageSize,
    };
  }

  // Feeds the report's filter dropdowns with real data — never a
  // hardcoded list — so Admin can only filter by telecom operators,
  // banks, and insurance companies that actually exist.
  async getFinancialReportFilterOptions() {
    const [operators, banks, providers] = await Promise.all([
      this.dataSource.query<{ operator_id: number; operator_name: string }[]>(
        `SELECT operator_id, operator_name FROM telecom_operators ORDER BY operator_name`,
      ),
      this.dataSource.query<{ bank_id: number; bank_name: string }[]>(
        `SELECT bank_id, bank_name FROM banks ORDER BY bank_name`,
      ),
      this.dataSource.query<{ provider_id: number; provider_name: string }[]>(
        `SELECT provider_id, provider_name FROM insurance_providers ORDER BY provider_name`,
      ),
    ]);

    return {
      operators: operators.map((o) => ({ id: o.operator_id, name: o.operator_name })),
      banks: banks.map((b) => ({ id: b.bank_id, name: b.bank_name })),
      insuranceProviders: providers.map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
      })),
    };
  }
}
