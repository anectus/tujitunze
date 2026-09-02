// PRINCIPLE 2 — outgoing-transaction diversion domain model.
//
// Backs `telecom_outgoing_transaction_events` + `outgoing_transaction_savings`
// (migration 0025_dual_mode_micro_savings.sql, split by 0028 — see this
// file's later note). Core rule: the transaction settles
// in full first; the saving is a small share of its VALUE, funded from
// the channel's own transaction margin (funding_source), never
// withheld from what the counterparty (biller/merchant/recipient)
// receives.
//
//   grossAmountTzs (already settled)  --- x savingRate --->  savedAmountTzs
//
// This implementation pass only wires TELECOM-authenticated intake
// (a telecom operator reporting its own mobile-money rail's outgoing
// transaction) — mobile money in Tanzania is telecom-operated, so this
// covers the dominant real case. The row shape still models
// provider_type/bank_id/switch_provider generically (see the DB CHECK
// constraint) so bank- and switch-authenticated intake are additive
// follow-ups, not a schema rewrite, once their own credential-issuance
// design exists.
//
// As of migration 0028, the underlying data lives in two physically
// separate tables — telecom_outgoing_transaction_events (Transaction
// Ledger: the raw inbound event) and outgoing_transaction_savings
// (Usage Ledger: the saving-rule outcome, one row per event).
// OutgoingTransactionDiversionRow below is still the flat *read* shape
// (produced by a JOIN across both — see
// TelecomService.selectOutgoingDiversionRow) so this file's mapper and
// every consumer of it are unchanged by that split.

export type OutgoingTransactionType =
  'TUMA' | 'LIPA_NAMBA' | 'TOA' | 'BILL_PAYMENT';

export type DiversionProviderType = 'TELECOM' | 'BANK' | 'SWITCH';

// SKIPPED / OPTED_OUT (added migration 0026) are both terminal,
// zero-saving outcomes that are still persisted — unlike the prior
// behavior of returning without writing a row — so every inbound event
// leaves an audit trail regardless of outcome.
export type DiversionStatus =
  | 'PENDING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REVERSED'
  | 'PENDING_REVIEW'
  | 'SKIPPED'
  | 'OPTED_OUT';

export interface OutgoingTransactionDiversionRow {
  diversion_id: number;
  external_transaction_id: string;
  member_id: number | null;
  phone_number: string;
  phone_id: number | null;
  provider_type: DiversionProviderType;
  telecom_operator_id: number | null;
  bank_id: number | null;
  switch_provider: string | null;
  transaction_type: OutgoingTransactionType;
  gross_amount_tzs: string;
  saving_rate: string;
  saved_amount_tzs: string;
  funding_source: string;
  status: DiversionStatus;
  contribution_id: number | null;
  transaction_timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OutgoingTransactionDiversion {
  diversionId: number;
  externalTransactionId: string;
  memberId: number | null;
  phoneNumber: string;
  phoneId: number | null;
  providerType: DiversionProviderType;
  telecomOperatorId: number | null;
  bankId: number | null;
  switchProvider: string | null;
  transactionType: OutgoingTransactionType;
  grossAmountTzs: string;
  savingRate: string;
  savedAmountTzs: string;
  fundingSource: string;
  status: DiversionStatus;
  contributionId: number | null;
  transactionTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function mapOutgoingTransactionDiversionRow(
  row: OutgoingTransactionDiversionRow,
): OutgoingTransactionDiversion {
  return {
    diversionId: row.diversion_id,
    externalTransactionId: row.external_transaction_id,
    memberId: row.member_id,
    phoneNumber: row.phone_number,
    phoneId: row.phone_id,
    providerType: row.provider_type,
    telecomOperatorId: row.telecom_operator_id,
    bankId: row.bank_id,
    switchProvider: row.switch_provider,
    transactionType: row.transaction_type,
    grossAmountTzs: row.gross_amount_tzs,
    savingRate: row.saving_rate,
    savedAmountTzs: row.saved_amount_tzs,
    fundingSource: row.funding_source,
    status: row.status,
    contributionId: row.contribution_id,
    transactionTimestamp: row.transaction_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function calculateDivertedAmount(
  grossAmountTzs: number,
  savingRate: number,
): number {
  return Math.round(grossAmountTzs * savingRate * 100) / 100;
}

export function buildDiversionReference(
  transactionType: OutgoingTransactionType,
  externalTransactionId: string,
): string {
  return `DIV-${transactionType}-${externalTransactionId}`;
}
