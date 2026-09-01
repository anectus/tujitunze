-- ============================================================
-- Migration 0022
-- VODACOM M-PESA C2B — extends payment_transactions (migrations 0018,
-- 0021) with the fields the C2B Single Stage integration needs.
-- Field-by-field design reviewed and approved before this migration was
-- written (see the accompanying analysis); each addition below is
-- purely additive. payment_transactions holds zero rows in every
-- environment this has been checked against — no backfill required.
-- ============================================================

BEGIN;

-- Raw MSISDN actually used for this specific transaction, immutable
-- even if the linked phone_numbers row is later edited (its FK has no
-- ON DELETE/ON UPDATE cascade) — mirrors the phone_number + phone_id
-- dual-storage pattern telecom_usage_events already established.
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS msisdn VARCHAR(20);

-- Verbatim output_ConversationID — Vodacom's own support/traceability
-- handle. No uniqueness asserted: Vodacom's own uniqueness guarantees
-- for this value are not documented.
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(100);

-- TUJITUNZE-generated correlation id, sent as
-- input_ThirdPartyConversationID and echoed back as
-- output_ThirdPartyConversationID. TUJITUNZE always generates this
-- itself (unlike external_transaction_id, which needs per-provider
-- partial uniqueness because it originates from the provider), so a
-- single table-wide UNIQUE constraint is correct here.
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS third_party_conversation_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_third_party_conversation_id_unique
    ON payment_transactions(third_party_conversation_id);

-- Verbatim output_ResponseCode — drives, but is kept distinct from, the
-- coarse `status` enum. Indexed: a real operational filter dimension
-- ("show all INS-2006 this week").
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS response_code VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_response_code ON payment_transactions(response_code);

-- Verbatim output_ResponseDesc — Vodacom's own raw text. NOT a
-- duplicate of the existing failure_reason column: failure_reason is
-- TUJITUNZE-composed and used across every channel/provider already;
-- response_description is Vodacom's exact wording, kept separately for
-- audit/dispute purposes.
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS response_description TEXT;

-- Real-time, per-row reconciliation marker — distinct from `status`
-- (which answers "what does TUJITUNZE currently believe happened").
-- Defaults to 'Pending' with NOT NULL: every row has some reconciliation
-- state from creation, not just once a response-dependent field arrives.
-- Deliberately a lightweight column here rather than an extension of
-- admin_reconciliation_records (that system is batch/periodic, keyed to
-- an uploaded external statement — a real complement for later, once a
-- Vodacom settlement statement exists to reconcile against, not a
-- replacement for this).
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'Pending';
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconciliation_status ON payment_transactions(reconciliation_status);

COMMIT;
