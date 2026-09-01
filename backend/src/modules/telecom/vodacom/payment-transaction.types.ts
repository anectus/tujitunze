// Payment Rail domain model — backs `payment_transactions` (migration
// 0018, extended for Vodacom by 0021 and 0022). Consolidated here (out
// of the former backend/src/modules/payments/ tree) as the single home
// for the Vodacom M-Pesa integration, per the "no second competing
// Vodacom architecture" rule — this is the only Vodacom-facing
// persistence model in the project.
//
//   payment_transactions  (this model — the payment rail's own record
//                           of what a provider told us, in payment-
//                           lifecycle terms)
//         |
//         v  (contribution_id / bank_transaction_id, set for channels
//             that route through an existing ledger table)
//   telecom_contributions / bank_transactions   (existing ledger)
//         |
//         v  (wallet_transactions, existing — correlated by
//             transaction_reference, since MOBILE_MONEY has no ledger
//             table of its own to point contribution_id/
//             bank_transaction_id at)
//   insurance_allocations  (existing)
//
// Follows this codebase's established convention for tables accessed
// via raw `manager.query()` rather than the TypeORM repository pattern
// (the same approach telecom_contributions / bank_transactions /
// insurance_allocations / admin_reconciliation_records already use) —
// a row interface in snake_case matching the DB columns exactly, plus a
// mapped camelCase shape for application code to return.

export type PaymentChannel =
  'TELECOM_AIRTIME' | 'BANK_TRANSFER' | 'MOBILE_MONEY';

// Identifies which concrete gateway/integration produced a row (e.g.
// 'VODACOM_MPESA') — distinct from `channel` (the abstract category)
// and from telecom_operator_id/bank_id (which named operator/bank).
// Free text at the DB layer (no CHECK constraint) so a new provider
// adapter never needs a migration just to add its name.
export type PaymentProvider = 'VODACOM_MPESA';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REVERSED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'PENDING_REVIEW';

// Exact row shape of payment_transactions, snake_case, for
// `manager.query<PaymentTransactionRow[]>(...)` call sites.
export interface PaymentTransactionRow {
  payment_transaction_id: number;
  external_transaction_id: string | null;
  internal_reference: string;
  member_id: number | null;
  channel: PaymentChannel;
  provider: PaymentProvider | null;
  telecom_operator_id: number | null;
  bank_id: number | null;
  phone_id: number | null;
  member_bank_account_id: number | null;
  // Raw MSISDN actually used for this specific transaction, immutable
  // even if the linked phone_numbers row's number is edited later
  // (migration 0022) — phone_id's FK has no ON DELETE/ON UPDATE
  // cascade, so this is the historically-accurate record.
  msisdn: string | null;
  amount: string;
  currency: string;
  transaction_type: string;
  status: PaymentStatus;
  provider_timestamp: Date | null;
  received_at: Date;
  processed_at: Date | null;
  failure_reason: string | null;
  reversal_reference: string | null;
  raw_reference: string | null;
  metadata: Record<string, unknown> | null;
  contribution_id: number | null;
  bank_transaction_id: number | null;
  // Verbatim output_ConversationID (migration 0022) — Vodacom's own
  // support/traceability handle, distinct from TUJITUNZE's reference.
  conversation_id: string | null;
  // TUJITUNZE-generated correlation id sent as
  // input_ThirdPartyConversationID and echoed back as
  // output_ThirdPartyConversationID (migration 0022) — unique per
  // attempt, a second independent idempotency key alongside
  // internal_reference.
  third_party_conversation_id: string | null;
  // Verbatim output_ResponseCode (migration 0022) — drives, but is kept
  // distinct from, the coarse `status` enum above.
  response_code: string | null;
  // Verbatim output_ResponseDesc (migration 0022) — Vodacom's own raw
  // text, distinct from TUJITUNZE-composed failure_reason.
  response_description: string | null;
  // Real-time, per-row reconciliation marker (migration 0022) —
  // distinct from status: answers "has this row's own result been
  // independently double-checked," not "what does TUJITUNZE currently
  // believe happened."
  reconciliation_status: string;
  created_at: Date;
  updated_at: Date;
}

// Application-facing camelCase shape.
export interface PaymentTransaction {
  paymentTransactionId: number;
  externalTransactionId: string | null;
  internalReference: string;
  memberId: number | null;
  channel: PaymentChannel;
  provider: PaymentProvider | null;
  telecomOperatorId: number | null;
  bankId: number | null;
  phoneId: number | null;
  memberBankAccountId: number | null;
  msisdn: string | null;
  amount: string;
  currency: string;
  transactionType: string;
  status: PaymentStatus;
  providerTimestamp: Date | null;
  receivedAt: Date;
  processedAt: Date | null;
  failureReason: string | null;
  reversalReference: string | null;
  rawReference: string | null;
  metadata: Record<string, unknown> | null;
  contributionId: number | null;
  bankTransactionId: number | null;
  conversationId: string | null;
  thirdPartyConversationId: string | null;
  responseCode: string | null;
  responseDescription: string | null;
  reconciliationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export function mapPaymentTransactionRow(
  row: PaymentTransactionRow,
): PaymentTransaction {
  return {
    paymentTransactionId: row.payment_transaction_id,
    externalTransactionId: row.external_transaction_id,
    internalReference: row.internal_reference,
    memberId: row.member_id,
    channel: row.channel,
    provider: row.provider,
    telecomOperatorId: row.telecom_operator_id,
    bankId: row.bank_id,
    phoneId: row.phone_id,
    memberBankAccountId: row.member_bank_account_id,
    msisdn: row.msisdn,
    amount: row.amount,
    currency: row.currency,
    transactionType: row.transaction_type,
    status: row.status,
    providerTimestamp: row.provider_timestamp,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
    failureReason: row.failure_reason,
    reversalReference: row.reversal_reference,
    rawReference: row.raw_reference,
    metadata: row.metadata,
    contributionId: row.contribution_id,
    bankTransactionId: row.bank_transaction_id,
    conversationId: row.conversation_id,
    thirdPartyConversationId: row.third_party_conversation_id,
    responseCode: row.response_code,
    responseDescription: row.response_description,
    reconciliationStatus: row.reconciliation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
