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

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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
}
