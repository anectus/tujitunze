import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import {
  PaymentTransactionRow,
  mapPaymentTransactionRow,
} from './payment-transaction.types';

// DB persistence for the Vodacom M-Pesa integration — reads/writes
// payment_transactions directly (migration 0018, extended by 0021 and
// 0022), never a separate "vodacom_mpesa_transactions" table. Isolated
// from VodacomC2BService so the idempotency-check + insert +
// status-update logic is independently unit-testable against a mocked
// DataSource.
//
// recordInitiated/recordOutcome accept an optional EntityManager so a
// caller can make the status write commit atomically alongside a wallet
// credit (dataSource.transaction(async (manager) => { ... })) — without
// one, they fall back to the plain DataSource, which is correct for the
// read-only idempotency pre-check and for the INITIATED insert (which
// intentionally happens before any Vodacom call, outside any larger
// transaction).
export interface RecordInitiatedInput {
  internalReference: string;
  memberId: number | null;
  telecomOperatorId: number;
  contributionId?: number | null;
  phoneId?: number | null;
  msisdn?: string;
  thirdPartyConversationId?: string;
  amount: number;
  currency: string;
  transactionType: string;
  reversalReference?: string;
}

export interface RecordOutcomeInput {
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'REVERSED';
  externalTransactionId?: string | null;
  conversationId?: string | null;
  responseCode?: string | null;
  responseDescription?: string | null;
  failureReason?: string | null;
  reconciliationStatus?: string;
  reversalReference?: string | null;
  // The provider's raw response body, kept verbatim for audit/dispute
  // purposes — maps to payment_transactions.raw_reference.
  rawResponse: unknown;
}

type Queryable = Pick<DataSource | EntityManager, 'query'>;

@Injectable()
export class VodacomTransactionRecorder {
  constructor(private readonly dataSource: DataSource) {}

  async findByInternalReference(internalReference: string) {
    const [row] = await this.dataSource.query<PaymentTransactionRow[]>(
      `SELECT * FROM payment_transactions WHERE internal_reference = $1`,
      [internalReference],
    );
    return row ? mapPaymentTransactionRow(row) : null;
  }

  async findByPaymentTransactionId(
    paymentTransactionId: number,
    queryable: Queryable = this.dataSource,
    lock = false,
  ) {
    const [row] = await queryable.query<PaymentTransactionRow[]>(
      `SELECT * FROM payment_transactions
       WHERE payment_transaction_id = $1${lock ? ' FOR UPDATE' : ''}`,
      [paymentTransactionId],
    );
    return row ? mapPaymentTransactionRow(row) : null;
  }

  async findReversalByOriginalReference(originalReference: string) {
    const [row] = await this.dataSource.query<PaymentTransactionRow[]>(
      `SELECT * FROM payment_transactions
       WHERE transaction_type = 'REVERSAL' AND reversal_reference = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [originalReference],
    );
    return row ? mapPaymentTransactionRow(row) : null;
  }

  // Called before ever attempting the real Vodacom call. The row is
  // created in INITIATED status — genuinely true at this point: a
  // request has been prepared but nothing has left TUJITUNZE yet.
  // third_party_conversation_id is stored here (not only on the final
  // outcome) because it must be sent in the outbound request itself.
  async recordInitiated(
    input: RecordInitiatedInput,
    queryable: Queryable = this.dataSource,
  ) {
    const [row] = await queryable.query<PaymentTransactionRow[]>(
      `INSERT INTO payment_transactions
         (internal_reference, member_id, channel, provider, telecom_operator_id, contribution_id, phone_id, msisdn, third_party_conversation_id, amount, currency, transaction_type, reversal_reference, status)
       VALUES ($1, $2, 'MOBILE_MONEY', 'VODACOM_MPESA', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'INITIATED')
       RETURNING *`,
      [
        input.internalReference,
        input.memberId,
        input.telecomOperatorId,
        input.contributionId ?? null,
        input.phoneId ?? null,
        input.msisdn ?? null,
        input.thirdPartyConversationId ?? null,
        input.amount,
        input.currency,
        input.transactionType,
        input.reversalReference ?? null,
      ],
    );
    return mapPaymentTransactionRow(row);
  }

  // Single write path for every terminal/interim outcome
  // (SUCCESSFUL/FAILED/PENDING) — pass `queryable` as the transaction's
  // EntityManager when this outcome must commit atomically with another
  // write (a SUCCESSFUL result and its wallet credit, in particular).
  async recordOutcome(
    paymentTransactionId: number,
    input: RecordOutcomeInput,
    queryable: Queryable = this.dataSource,
  ) {
    const [[row]] = await queryable.query<[PaymentTransactionRow[], number]>(
      `UPDATE payment_transactions
       SET status = CASE
             WHEN status IN ('SUCCESSFUL', 'REVERSED') THEN status
             ELSE $2
           END,
           external_transaction_id = COALESCE($3, external_transaction_id),
           conversation_id = COALESCE($4, conversation_id),
           response_code = COALESCE($5, response_code),
           response_description = COALESCE($6, response_description),
           failure_reason = COALESCE($7, failure_reason),
           raw_reference = COALESCE($8, raw_reference),
           reconciliation_status = COALESCE($9, reconciliation_status),
           reversal_reference = COALESCE($10, reversal_reference),
           processed_at = NOW(),
           updated_at = NOW()
       WHERE payment_transaction_id = $1
       RETURNING *`,
      [
        paymentTransactionId,
        input.status,
        input.externalTransactionId ?? null,
        input.conversationId ?? null,
        input.responseCode ?? null,
        input.responseDescription ?? null,
        input.failureReason ?? null,
        input.rawResponse === undefined || input.rawResponse === null
          ? null
          : JSON.stringify(input.rawResponse),
        input.reconciliationStatus ?? null,
        input.reversalReference ?? null,
      ],
    );

    if (!row) {
      throw new NotFoundException('Payment transaction not found');
    }
    return mapPaymentTransactionRow(row);
  }

  async markReversed(
    paymentTransactionId: number,
    reversalInternalReference: string,
    queryable: Queryable = this.dataSource,
  ) {
    const [[row]] = await queryable.query<[PaymentTransactionRow[], number]>(
      `UPDATE payment_transactions
       SET status = 'REVERSED',
           reversal_reference = $2,
           processed_at = NOW(),
           updated_at = NOW()
       WHERE payment_transaction_id = $1
       RETURNING *`,
      [paymentTransactionId, reversalInternalReference],
    );
    if (!row) {
      throw new NotFoundException('Payment transaction not found');
    }
    return mapPaymentTransactionRow(row);
  }

  async getVodacomOperatorId(): Promise<number> {
    const [row] = await this.dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name = 'Vodacom' LIMIT 1`,
    );
    if (!row) {
      throw new NotFoundException(
        'No "Vodacom" row exists in telecom_operators — cannot record an M-Pesa transaction',
      );
    }
    return row.operator_id;
  }
}
