-- ============================================================
-- Migration 0026
-- Closes the two "silent data loss" gaps flagged by the 2026-09-02
-- audit of the dual-mode micro-savings engine (0025):
--
-- 1. Both webhook handlers could previously respond to the operator
--    without persisting anything (no active rule / member opted out),
--    so there was no record that the call ever happened. This
--    migration widens each table's status vocabulary so a row can be
--    written for every inbound event, whatever the outcome —
--    telecom_resource_conversions and outgoing_transaction_diversions
--    now double as the Transaction Ledger the audit asked for (an
--    unconditional record of "this event was received") *and* the
--    Usage Ledger (the split itself), since once persistence is
--    unconditional there is no remaining 1:many relationship between
--    "an event happened" and "here is its detail row" that would
--    justify a fourth table — see CLAUDE.md for the full reasoning.
--    saving_ledger remains the separate, genuinely cross-cutting
--    Saving Ledger, unchanged by this migration.
--
-- 2. There was no member-facing consent mechanism at all. This
--    migration adds member_saving_consents; every member defaults to
--    consented = TRUE (opted in) so existing savings behavior is
--    unchanged today — a member can opt out later via
--    PATCH /members/saving-consent.
-- ============================================================

BEGIN;

ALTER TABLE telecom_resource_conversions DROP CONSTRAINT IF EXISTS telecom_resource_conversions_status_check;
ALTER TABLE telecom_resource_conversions ADD CONSTRAINT telecom_resource_conversions_status_check
    CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW', 'NO_ACTIVE_RULE', 'OPTED_OUT'));

ALTER TABLE outgoing_transaction_diversions DROP CONSTRAINT IF EXISTS outgoing_transaction_diversions_status_check;
ALTER TABLE outgoing_transaction_diversions ADD CONSTRAINT outgoing_transaction_diversions_status_check
    CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW', 'SKIPPED', 'OPTED_OUT'));

-- One row per member; absence of a row means "consented" (the default),
-- matching the product decision that existing members keep saving
-- uninterrupted — only an explicit opt-out row changes behavior.
CREATE TABLE IF NOT EXISTS member_saving_consents (
    member_id INT PRIMARY KEY REFERENCES users(user_id),
    consented BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
