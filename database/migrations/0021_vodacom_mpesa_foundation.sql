-- ============================================================
-- Migration 0021
-- VODACOM M-PESA INTEGRATION FOUNDATION — extends the existing
-- payment_transactions table (migration 0018) rather than creating a
-- new "vodacom_mpesa_transactions" table. Field-by-field audit against
-- the requested spec showed payment_transactions already covers nearly
-- everything (internal_reference = internal transaction ID /
-- correlation-idempotency key; external_transaction_id = provider
-- transaction/reference ID; member_id; amount; currency;
-- transaction_type; status — INITIATED/PENDING/SUCCESSFUL/FAILED/
-- REVERSED already exist in the CHECK constraint; failure_reason;
-- reversal_reference; received_at/processed_at = request/response
-- timestamp; raw_reference = provider response/reference; created_at/
-- updated_at). Only two genuine gaps existed, both addressed below.
--
-- payment_transactions holds zero rows (verified live immediately
-- before writing this migration) and is not yet consumed by any
-- application code — these are safe, non-destructive corrections, not
-- changes to anything in production use.
-- ============================================================

BEGIN;

-- GAP 1: no column identifies WHICH concrete gateway/integration
-- produced a row. channel ('TELECOM_AIRTIME'/'BANK_TRANSFER') is an
-- abstract category; telecom_operator_id/bank_id identify WHICH named
-- operator/bank — neither says "via the M-Pesa Open API specifically"
-- (as opposed to, say, a future direct USSD aggregator integration
-- with the same operator). Free-text (validated at the application
-- layer, not a DB CHECK) so a new provider adapter never needs a
-- migration just to add its name — same reasoning contribution_source/
-- transaction_type already use elsewhere in this schema.
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider);

-- GAP 2: M-Pesa C2B/B2C is a direct mobile-money wallet movement — a
-- real, distinct category from both TELECOM_AIRTIME (usage/recharge-
-- based contribution) and BANK_TRANSFER (linked bank account). Forcing
-- it into either existing bucket would overload their meaning a third
-- time; MOBILE_MONEY is added as a genuine third channel rather than
-- reusing TELECOM_AIRTIME by convenience. Still routes through
-- telecom_operator_id (a mobile money operator IS a telecom operator,
-- e.g. Vodacom) with bank_id NULL, mirroring the existing pattern.
ALTER TABLE payment_transactions DROP CONSTRAINT payment_transactions_channel_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_channel_check
    CHECK (channel IN ('TELECOM_AIRTIME', 'BANK_TRANSFER', 'MOBILE_MONEY'));

ALTER TABLE payment_transactions DROP CONSTRAINT payment_transactions_channel_provider_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_channel_provider_check
    CHECK (
        (channel = 'TELECOM_AIRTIME' AND telecom_operator_id IS NOT NULL AND bank_id IS NULL)
        OR
        (channel = 'BANK_TRANSFER' AND bank_id IS NOT NULL AND telecom_operator_id IS NULL)
        OR
        (channel = 'MOBILE_MONEY' AND telecom_operator_id IS NOT NULL AND bank_id IS NULL)
    );

-- GAP 3 (structural, not in the requested field list, but required to
-- make the table usable for an OUTBOUND-initiated payment): the
-- existing NOT NULL on external_transaction_id was designed for the
-- INBOUND webhook direction, where the provider's own ID is already
-- known in the payload at insert time. For an OUTBOUND call TUJITUNZE
-- itself initiates (C2B/B2C), Vodacom's transaction ID is genuinely
-- unknown until their response arrives — internal_reference (already
-- NOT NULL + UNIQUE) is what TUJITUNZE checks for idempotency/
-- correlation before that point. Relaxed to nullable, with a new CHECK
-- (mirroring migration 0020's identical pattern for
-- provider_valuation_tzs) that a row can never be marked SUCCESSFUL
-- without a real provider transaction ID recorded — Postgres unique
-- indexes already permit unlimited NULLs, so multiple in-flight
-- outbound requests awaiting a response never collide.
ALTER TABLE payment_transactions ALTER COLUMN external_transaction_id DROP NOT NULL;

ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_external_id_required_for_success
    CHECK (status != 'SUCCESSFUL' OR external_transaction_id IS NOT NULL);

COMMIT;
