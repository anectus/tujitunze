// PHASE 2 — Payment Rail domain model.
//
// This file defines the TypeScript shape of `payment_transactions`
// (migration 0018_payment_transactions.sql) — the new layer sitting
// above the existing, UNCHANGED contribution ledger
// (telecom_contributions / bank_transactions / wallet_transactions /
// insurance_allocations):
//
//   payment_transactions (this model)
//         -> telecom_contributions / bank_transactions (existing ledger)
//         -> wallet_transactions (existing)
//         -> insurance_allocations (existing)
//
// Deliberately types-only, no service/controller/business logic here —
// that is PHASE 4 (telecom webhook), PHASE 5 (bank webhook), and
// PHASE 6 (state machine), not yet implemented. Not currently imported
// by any application code; introducing it does not change runtime
// behavior.
//
// Follows this codebase's established convention for tables accessed
// via raw `manager.query()` rather than the TypeORM repository pattern
// (the same approach telecom_contributions / bank_transactions /
// insurance_allocations / admin_reconciliation_records already use,
// as opposed to WalletTransaction/HealthWallet's `@Entity` classes) —
// a row interface in snake_case matching the DB columns exactly, plus a
// mapped camelCase shape for application code to return, matching every
// other service in this project (see e.g. TelecomService's
// ContributionRow -> the object literals its methods return).

// MOBILE_MONEY added by migration 0021 (Vodacom M-Pesa foundation) — a
// direct mobile-money wallet movement (M-Pesa C2B/B2C) is a genuinely
// distinct category from TELECOM_AIRTIME (usage/recharge-based
// contribution) and BANK_TRANSFER (linked bank account), not a reuse
// of either.
export type PaymentChannel =
  'TELECOM_AIRTIME' | 'BANK_TRANSFER' | 'MOBILE_MONEY';

// Identifies which concrete gateway/integration produced a row (e.g.
// 'VODACOM_MPESA') — distinct from `channel` (the abstract category)
// and from telecom_operator_id/bank_id (which named operator/bank).
// Free text at the DB layer (no CHECK constraint) so a new provider
// adapter never needs a migration just to add its name; this union is
// the application-layer source of truth instead, extended as real
// adapters are added.
export type PaymentProvider = 'VODACOM_MPESA';

// 7 statuses named in PHASE 2, plus PENDING_REVIEW from PHASE 3 (a
// payment that cannot yet be confidently matched to a member must not
// auto-credit — see the migration's note on why this 8th value is in
// the CHECK constraint already, even though PHASE 3 itself isn't
// implemented in this step).
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
  // Nullable since migration 0021: an OUTBOUND-initiated payment (e.g.
  // Vodacom M-Pesa C2B) is created before the provider's own
  // transaction ID is known. A row can never reach SUCCESSFUL status
  // without one (enforced by a DB CHECK), but INITIATED/PENDING/FAILED
  // legitimately have it NULL.
  external_transaction_id: string | null;
  internal_reference: string;
  member_id: number | null;
  channel: PaymentChannel;
  provider: PaymentProvider | null;
  telecom_operator_id: number | null;
  bank_id: number | null;
  phone_id: number | null;
  member_bank_account_id: number | null;
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
  created_at: Date;
  updated_at: Date;
}

// Application-facing camelCase shape — what a future PaymentsService
// would return from its methods, mirroring how every other service in
// this codebase (TelecomService, BankService, InsuranceService, ...)
// maps its own snake_case rows before returning them.
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
