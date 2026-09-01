import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ReconciliationCheckDto } from './dto/reconciliation-check.dto';
import { CreateReconciliationRunDto } from './dto/create-reconciliation-run.dto';

export type ReconciliationStatus =
  | 'Matched'
  | 'Duplicate'
  | 'Missing'
  | 'Unknown'
  | 'UnknownMember'
  | 'AmountMismatch'
  | 'FailedAllocation'
  | 'Reversed'
  | 'AlreadyProcessed';

export interface ReconciliationChecks {
  externalTransactionExists: boolean;
  contributionExists: boolean | null;
  amountMatches: boolean | null;
  memberMatches: boolean | null;
  allocationExists: boolean | null;
  allocationAmountMatches: boolean | null;
  alreadyProcessed: boolean;
}

export interface ReconciliationResult {
  channel: 'AIRTIME' | 'BANK_TRANSFER';
  externalReference: string;
  externalAmount: number;
  memberIdentifier: string | null;
  contributionId: number | null;
  bankTransactionId: number | null;
  allocationId: number | null;
  checks: ReconciliationChecks;
  status: ReconciliationStatus;
  detail: string;
}

interface PartialResult {
  status: ReconciliationStatus;
  detail: string;
  contributionExists?: boolean | null;
  internalId?: number | null;
  amountMatches?: boolean | null;
  memberMatches?: boolean | null;
  allocationExists?: boolean | null;
  allocationId?: number | null;
  allocationAmountMatches?: boolean | null;
}

// Admin-facing, cross-channel financial reconciliation. Distinct from
// (and does not duplicate) the per-channel, tenant-scoped Telecom/Bank
// self-service reconciliation (telecom_reconciliation_runs/records,
// bank_reconciliation_runs/records): those only check "does a
// contribution exist with this reference+amount", scoped to one
// operator/bank. This walks the full CLAUDE.md STEP 7 chain —
//
//   EXTERNAL TRANSACTION -> TUJITUNZE CONTRIBUTION -> INSURANCE ALLOCATION
//
// — across both channels in one place, and answers all seven checks
// Admin needs. Every result is computed live off telecom_contributions /
// bank_transactions / insurance_allocations / wallet_transactions —
// never fabricated — so a run this service produces is only as good as
// what those tables actually contain right now.
@Injectable()
export class AdminReconciliationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private buildResult(
    dto: ReconciliationCheckDto,
    amount: number,
    partial: PartialResult,
  ): ReconciliationResult {
    return {
      channel: dto.channel,
      externalReference: dto.externalReference,
      externalAmount: amount,
      memberIdentifier: dto.memberIdentifier ?? null,
      contributionId:
        dto.channel === 'AIRTIME' ? (partial.internalId ?? null) : null,
      bankTransactionId:
        dto.channel === 'BANK_TRANSFER' ? (partial.internalId ?? null) : null,
      allocationId: partial.allocationId ?? null,
      checks: {
        externalTransactionExists: true,
        contributionExists: partial.contributionExists ?? null,
        amountMatches: partial.amountMatches ?? null,
        memberMatches: partial.memberMatches ?? null,
        allocationExists: partial.allocationExists ?? null,
        allocationAmountMatches: partial.allocationAmountMatches ?? null,
        alreadyProcessed: false,
      },
      status: partial.status,
      detail: partial.detail,
    };
  }

  // The single-record chain-check. Read-only — safe to call outside a
  // transaction for the ad-hoc /admin/reconciliation/check endpoint, and
  // reused unchanged inside createRun()'s transaction for a full batch.
  async checkOne(
    manager: EntityManager,
    dto: ReconciliationCheckDto,
  ): Promise<ReconciliationResult> {
    const amount = Number(dto.amount.toFixed(2));

    // "Already processed": this exact external reference was already
    // reconciled as Matched in an earlier run. Re-surfacing it as
    // Matched again would imply HSIMS is processing it a second time.
    const [priorMatch] = await manager.query<{ record_id: number }[]>(
      `SELECT record_id FROM admin_reconciliation_records
       WHERE channel = $1 AND external_reference = $2 AND reconciliation_status = 'Matched'
       LIMIT 1`,
      [dto.channel, dto.externalReference],
    );

    if (priorMatch) {
      return {
        channel: dto.channel,
        externalReference: dto.externalReference,
        externalAmount: amount,
        memberIdentifier: dto.memberIdentifier ?? null,
        contributionId: null,
        bankTransactionId: null,
        allocationId: null,
        checks: {
          externalTransactionExists: true,
          contributionExists: null,
          amountMatches: null,
          memberMatches: null,
          allocationExists: null,
          allocationAmountMatches: null,
          alreadyProcessed: true,
        },
        status: 'AlreadyProcessed',
        detail:
          'This external transaction was already reconciled as Matched in a previous run.',
      };
    }

    if (dto.channel === 'AIRTIME') {
      const rows = await manager.query<
        {
          contribution_id: number;
          member_id: number;
          contribution_amount: string;
          processing_status: string;
        }[]
      >(
        `SELECT contribution_id, member_id, contribution_amount, processing_status
         FROM telecom_contributions WHERE reference_number = $1`,
        [dto.externalReference],
      );

      if (rows.length > 1) {
        return this.buildResult(dto, amount, {
          status: 'Duplicate',
          detail: `${rows.length} telecom_contributions rows share this reference_number.`,
          contributionExists: true,
        });
      }

      const contribution = rows[0];
      if (!contribution) {
        return this.buildResult(dto, amount, {
          status: 'Missing',
          detail:
            'No telecom_contributions row found for this external reference.',
          contributionExists: false,
        });
      }

      if (['Reversed', 'Failed'].includes(contribution.processing_status)) {
        return this.buildResult(dto, amount, {
          status: 'Reversed',
          detail: `Contribution's processing_status is ${contribution.processing_status}.`,
          contributionExists: true,
          internalId: contribution.contribution_id,
        });
      }

      const amountMatches = Number(contribution.contribution_amount) === amount;
      if (!amountMatches) {
        return this.buildResult(dto, amount, {
          status: 'AmountMismatch',
          detail: `Reported amount ${amount} does not match the recorded contribution amount ${contribution.contribution_amount}.`,
          contributionExists: true,
          internalId: contribution.contribution_id,
          amountMatches: false,
        });
      }

      let memberMatches: boolean | null = null;
      if (dto.memberIdentifier) {
        const [phone] = await manager.query<{ user_id: number }[]>(
          `SELECT user_id FROM phone_numbers WHERE phone_number = $1`,
          [dto.memberIdentifier],
        );
        memberMatches = !!phone && phone.user_id === contribution.member_id;
        if (!memberMatches) {
          return this.buildResult(dto, amount, {
            status: 'UnknownMember',
            detail: `Phone number ${dto.memberIdentifier} does not resolve to this contribution's member.`,
            contributionExists: true,
            internalId: contribution.contribution_id,
            amountMatches: true,
            memberMatches: false,
          });
        }
      }

      return this.checkAllocationAndFinish(
        dto,
        amount,
        contribution.contribution_id,
        memberMatches,
        `SELECT ia.allocation_id, ia.allocation_status, ia.amount
         FROM wallet_transactions wt
         JOIN insurance_allocations ia ON ia.wallet_transaction_id = wt.wallet_transaction_id
         WHERE wt.contribution_id = $1`,
        manager,
      );
    }

    // BANK_TRANSFER
    const rows = await manager.query<
      {
        bank_transaction_id: number;
        member_id: number;
        amount: string;
        transaction_status: string;
      }[]
    >(
      `SELECT bt.bank_transaction_id, mba.member_id, bt.amount, bt.transaction_status
       FROM bank_transactions bt
       JOIN member_bank_accounts mba ON mba.member_bank_account_id = bt.member_bank_account_id
       WHERE bt.transaction_reference = $1`,
      [dto.externalReference],
    );

    if (rows.length > 1) {
      return this.buildResult(dto, amount, {
        status: 'Duplicate',
        detail: `${rows.length} bank_transactions rows share this transaction_reference.`,
        contributionExists: true,
      });
    }

    const transaction = rows[0];
    if (!transaction) {
      return this.buildResult(dto, amount, {
        status: 'Missing',
        detail: 'No bank_transactions row found for this external reference.',
        contributionExists: false,
      });
    }

    if (['Reversed', 'Failed'].includes(transaction.transaction_status)) {
      return this.buildResult(dto, amount, {
        status: 'Reversed',
        detail: `Transaction's transaction_status is ${transaction.transaction_status}.`,
        contributionExists: true,
        internalId: transaction.bank_transaction_id,
      });
    }

    const amountMatches = Number(transaction.amount) === amount;
    if (!amountMatches) {
      return this.buildResult(dto, amount, {
        status: 'AmountMismatch',
        detail: `Reported amount ${amount} does not match the recorded transaction amount ${transaction.amount}.`,
        contributionExists: true,
        internalId: transaction.bank_transaction_id,
        amountMatches: false,
      });
    }

    let memberMatches: boolean | null = null;
    if (dto.memberIdentifier) {
      const [account] = await manager.query<{ member_id: number }[]>(
        `SELECT member_id FROM member_bank_accounts WHERE account_number = $1`,
        [dto.memberIdentifier],
      );
      memberMatches = !!account && account.member_id === transaction.member_id;
      if (!memberMatches) {
        return this.buildResult(dto, amount, {
          status: 'UnknownMember',
          detail: `Account number ${dto.memberIdentifier} does not resolve to this transaction's member.`,
          contributionExists: true,
          internalId: transaction.bank_transaction_id,
          amountMatches: true,
          memberMatches: false,
        });
      }
    }

    return this.checkAllocationAndFinish(
      dto,
      amount,
      transaction.bank_transaction_id,
      memberMatches,
      `SELECT ia.allocation_id, ia.allocation_status, ia.amount
       FROM wallet_transactions wt
       JOIN insurance_allocations ia ON ia.wallet_transaction_id = wt.wallet_transaction_id
       WHERE wt.bank_transaction_id = $1`,
      manager,
    );
  }

  private async checkAllocationAndFinish(
    dto: ReconciliationCheckDto,
    amount: number,
    internalId: number,
    memberMatches: boolean | null,
    allocationQuery: string,
    manager: EntityManager,
  ): Promise<ReconciliationResult> {
    const [allocation] = await manager.query<
      { allocation_id: number; allocation_status: string; amount: string }[]
    >(allocationQuery, [internalId]);

    if (allocation?.allocation_status === 'Reversed') {
      return this.buildResult(dto, amount, {
        status: 'Reversed',
        detail: "This contribution's insurance allocation was reversed.",
        contributionExists: true,
        internalId,
        amountMatches: true,
        memberMatches,
        allocationExists: true,
        allocationId: allocation.allocation_id,
        allocationAmountMatches: Number(allocation.amount) === amount,
      });
    }

    if (allocation?.allocation_status === 'Failed') {
      return this.buildResult(dto, amount, {
        status: 'FailedAllocation',
        detail:
          "This contribution's insurance allocation failed (its insurance provider was not Active).",
        contributionExists: true,
        internalId,
        amountMatches: true,
        memberMatches,
        allocationExists: true,
        allocationId: allocation.allocation_id,
        allocationAmountMatches: Number(allocation.amount) === amount,
      });
    }

    return this.buildResult(dto, amount, {
      status: 'Matched',
      detail: allocation
        ? 'The transaction, its contribution, and its insurance allocation all reconcile cleanly.'
        : 'The transaction and its contribution reconcile cleanly; the member has no active policy to allocate against.',
      contributionExists: true,
      internalId,
      amountMatches: true,
      memberMatches,
      allocationExists: !!allocation,
      allocationId: allocation?.allocation_id ?? null,
      allocationAmountMatches: allocation
        ? Number(allocation.amount) === amount
        : null,
    });
  }

  // "Unknown transaction": a TUJITUNZE contribution/bank_transaction that
  // exists in this channel/date window but was never reported in the
  // batch being reconciled — i.e. HSIMS has a financial record nothing
  // external vouches for.
  private async scanUnknownInternalRecords(
    manager: EntityManager,
    channel: 'AIRTIME' | 'BANK_TRANSFER',
    from: string,
    to: string,
    reportedReferences: Set<string>,
  ): Promise<ReconciliationResult[]> {
    if (channel === 'AIRTIME') {
      const rows = await manager.query<
        {
          contribution_id: number;
          reference_number: string;
          contribution_amount: string;
        }[]
      >(
        `SELECT contribution_id, reference_number, contribution_amount
         FROM telecom_contributions
         WHERE contribution_date >= $1 AND contribution_date <= $2`,
        [from, to],
      );

      return rows
        .filter((row) => !reportedReferences.has(row.reference_number))
        .map((row) => ({
          channel,
          externalReference: row.reference_number,
          externalAmount: Number(row.contribution_amount),
          memberIdentifier: null,
          contributionId: row.contribution_id,
          bankTransactionId: null,
          allocationId: null,
          checks: {
            externalTransactionExists: false,
            contributionExists: true,
            amountMatches: null,
            memberMatches: null,
            allocationExists: null,
            allocationAmountMatches: null,
            alreadyProcessed: false,
          },
          status: 'Unknown',
          detail:
            'TUJITUNZE has a contribution for this reference that was not present in the reported external batch.',
        }));
    }

    const rows = await manager.query<
      {
        bank_transaction_id: number;
        transaction_reference: string;
        amount: string;
      }[]
    >(
      `SELECT bank_transaction_id, transaction_reference, amount
       FROM bank_transactions
       WHERE transaction_date >= $1 AND transaction_date <= $2`,
      [from, to],
    );

    return rows
      .filter((row) => !reportedReferences.has(row.transaction_reference))
      .map((row) => ({
        channel,
        externalReference: row.transaction_reference,
        externalAmount: Number(row.amount),
        memberIdentifier: null,
        contributionId: null,
        bankTransactionId: row.bank_transaction_id,
        allocationId: null,
        checks: {
          externalTransactionExists: false,
          contributionExists: true,
          amountMatches: null,
          memberMatches: null,
          allocationExists: null,
          allocationAmountMatches: null,
          alreadyProcessed: false,
        },
        status: 'Unknown',
        detail:
          'TUJITUNZE has a transaction for this reference that was not present in the reported external batch.',
      }));
  }

  // Ad-hoc, unpersisted single check — answers the seven questions for
  // one external transaction on demand.
  async checkSingle(
    dto: ReconciliationCheckDto,
  ): Promise<ReconciliationResult> {
    return this.checkOne(this.dataSource.manager, dto);
  }

  async createRun(
    userId: number,
    dto: CreateReconciliationRunDto,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const [run] = await manager.query<{ run_id: number }[]>(
        `INSERT INTO admin_reconciliation_runs (initiated_by, total_records)
         VALUES ($1, $2) RETURNING run_id`,
        [userId, dto.records.length],
      );
      const runId = run.run_id;

      const seenInBatch = new Set<string>();
      let matchedCount = 0;
      let exceptionCount = 0;
      const results: ReconciliationResult[] = [];

      const insertRecord = async (result: ReconciliationResult) => {
        await manager.query(
          `INSERT INTO admin_reconciliation_records
             (run_id, channel, external_reference, external_amount, member_identifier,
              contribution_id, bank_transaction_id, allocation_id,
              external_transaction_exists, contribution_exists, amount_matches, member_matches,
              allocation_exists, allocation_amount_matches, already_processed, reconciliation_status, detail)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            runId,
            result.channel,
            result.externalReference,
            result.externalAmount,
            result.memberIdentifier,
            result.contributionId,
            result.bankTransactionId,
            result.allocationId,
            result.checks.externalTransactionExists,
            result.checks.contributionExists,
            result.checks.amountMatches,
            result.checks.memberMatches,
            result.checks.allocationExists,
            result.checks.allocationAmountMatches,
            result.checks.alreadyProcessed,
            result.status,
            result.detail,
          ],
        );
      };

      for (const record of dto.records) {
        const key = `${record.channel}::${record.externalReference}`;
        let result: ReconciliationResult;

        if (seenInBatch.has(key)) {
          result = this.buildResult(record, Number(record.amount.toFixed(2)), {
            status: 'Duplicate',
            detail:
              'This external reference appears more than once in this upload batch.',
          });
        } else {
          result = await this.checkOne(manager, record);
        }
        seenInBatch.add(key);

        if (result.status === 'Matched') {
          matchedCount += 1;
        } else {
          exceptionCount += 1;
        }

        await insertRecord(result);
        results.push(result);
      }

      let totalRecords = dto.records.length;

      if (dto.scanUnknownChannel && dto.scanUnknownFrom && dto.scanUnknownTo) {
        const reportedRefs = new Set(
          dto.records
            .filter((r) => r.channel === dto.scanUnknownChannel)
            .map((r) => r.externalReference),
        );
        const unknowns = await this.scanUnknownInternalRecords(
          manager,
          dto.scanUnknownChannel,
          dto.scanUnknownFrom,
          dto.scanUnknownTo,
          reportedRefs,
        );

        for (const unknown of unknowns) {
          exceptionCount += 1;
          totalRecords += 1;
          await insertRecord(unknown);
          results.push(unknown);
        }
      }

      await manager.query(
        `UPDATE admin_reconciliation_runs
         SET total_records = $2, matched_count = $3, exception_count = $4
         WHERE run_id = $1`,
        [runId, totalRecords, matchedCount, exceptionCount],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'admin.reconciliation_run',
        affectedTable: 'admin_reconciliation_runs',
        affectedRecordId: runId,
        newValue: { totalRecords, matchedCount, exceptionCount },
        ipAddress,
      });

      return {
        runId,
        totalRecords,
        matchedCount,
        exceptionCount,
        records: results,
      };
    });
  }

  async listRuns() {
    return this.dataSource.query<
      {
        run_id: number;
        total_records: number;
        matched_count: number;
        exception_count: number;
        run_date: Date;
      }[]
    >(
      `SELECT run_id, total_records, matched_count, exception_count, run_date
       FROM admin_reconciliation_runs
       ORDER BY run_date DESC`,
    );
  }

  async getRun(runId: number) {
    const [run] = await this.dataSource.query<
      {
        run_id: number;
        total_records: number;
        matched_count: number;
        exception_count: number;
        run_date: Date;
      }[]
    >(
      `SELECT run_id, total_records, matched_count, exception_count, run_date
       FROM admin_reconciliation_runs WHERE run_id = $1`,
      [runId],
    );

    if (!run) {
      throw new NotFoundException('Reconciliation run not found');
    }

    const records = await this.dataSource.query<
      {
        record_id: number;
        channel: string;
        external_reference: string;
        external_amount: string;
        member_identifier: string | null;
        contribution_id: number | null;
        bank_transaction_id: number | null;
        allocation_id: number | null;
        external_transaction_exists: boolean;
        contribution_exists: boolean | null;
        amount_matches: boolean | null;
        member_matches: boolean | null;
        allocation_exists: boolean | null;
        allocation_amount_matches: boolean | null;
        already_processed: boolean;
        reconciliation_status: string;
        detail: string | null;
        created_at: Date;
      }[]
    >(
      `SELECT record_id, channel, external_reference, external_amount, member_identifier,
              contribution_id, bank_transaction_id, allocation_id,
              external_transaction_exists, contribution_exists, amount_matches, member_matches,
              allocation_exists, allocation_amount_matches, already_processed, reconciliation_status, detail, created_at
       FROM admin_reconciliation_records
       WHERE run_id = $1
       ORDER BY record_id`,
      [runId],
    );

    return {
      runId: run.run_id,
      totalRecords: run.total_records,
      matchedCount: run.matched_count,
      exceptionCount: run.exception_count,
      runDate: run.run_date,
      records: records.map((row) => ({
        recordId: row.record_id,
        channel: row.channel,
        externalReference: row.external_reference,
        externalAmount: row.external_amount,
        memberIdentifier: row.member_identifier,
        contributionId: row.contribution_id,
        bankTransactionId: row.bank_transaction_id,
        allocationId: row.allocation_id,
        checks: {
          externalTransactionExists: row.external_transaction_exists,
          contributionExists: row.contribution_exists,
          amountMatches: row.amount_matches,
          memberMatches: row.member_matches,
          allocationExists: row.allocation_exists,
          allocationAmountMatches: row.allocation_amount_matches,
          alreadyProcessed: row.already_processed,
        },
        status: row.reconciliation_status,
        detail: row.detail,
        createdAt: row.created_at,
      })),
    };
  }
}
