-- ============================================================
-- Migration 0019
-- 6% TELECOM USAGE CONTRIBUTION MODEL — database/domain changes only.
--
-- AUDIT FINDING this migration is built on (see the accompanying
-- report): the existing telecom contribution flow
-- (TelecomService.recordContribution/handleContributionWebhook,
-- STEP 3-5) computes a contribution from a PURCHASE/RECHARGE amount
-- (dto.transactionType IN 'Airtime'/'Data Bundle'/'Mobile Money
-- Transfer', rate looked up from contribution_rules.rule_type). That is
-- a fundamentally different event from QUALIFYING TELECOM USAGE
-- (voice minutes / SMS / data actually consumed, each with its own
-- operator-assigned monetary value) — the business rule explicitly
-- requires these be modelled as distinct concepts, not conflated. No
-- table already exists for usage events; contribution_rules exists but
-- has no way to represent a usage-type-scoped rate.
--
-- This migration:
--   1. Extends contribution_rules (reused, not duplicated) with the
--      columns needed to also represent usage-type-scoped rules,
--      without touching any column the existing purchase-based flow
--      already reads (rule_type, rate_percent, minimum_amount,
--      effective_date, is_active all keep their exact current meaning
--      and are unmodified — telecom.service.ts's and bank.service.ts's
--      existing `WHERE rule_type = $1 AND is_active = true AND
--      effective_date <= CURRENT_DATE` queries are untouched and keep
--      working exactly as before).
--   2. Seeds 3 new rows: TELECOM/VOICE, TELECOM/SMS, TELECOM/DATA, each
--      at the required 6% — configurable data, not a hardcoded constant
--      anywhere in application code.
--   3. Creates telecom_usage_events — the new raw-usage-event capture
--      layer, analogous to how payment_transactions (migration 0018)
--      sits above the existing contribution ledger. Once usage-webhook
--      wiring is implemented (a later, explicitly-deferred step), a
--      successful usage event will produce a normal
--      telecom_contributions row (contribution_source = 'VOICE' /
--      'SMS' / 'DATA') through the SAME wallet_transactions /
--      insurance_allocations chain every other contribution already
--      uses — telecom_contributions itself needs NO schema change:
--      contribution_source is a free varchar(50) with no CHECK
--      constraint, so it already accepts these new values.
--
-- No existing table is dropped, renamed, or has a column removed. Safe
-- to re-run (IF NOT EXISTS / WHERE NOT EXISTS throughout).
-- ============================================================

BEGIN;

-- ============================================================
-- CONTRIBUTION_RULES — extended, not replaced
-- ============================================================

-- `channel` distinguishes which collection channel a rule belongs to
-- (TELECOM vs BANK) — useful for admin tooling to filter/manage rules
-- without parsing rule_type strings. Nullable + backfilled for the 4
-- pre-existing rows rather than required, since making it NOT NULL
-- would force a value onto rows this migration didn't originally
-- design.
ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS channel VARCHAR(20);

-- `usage_type` is NULL for the existing purchase-based rules (Airtime /
-- Data Bundle / Mobile Money Transfer / Bank Transfer are not usage
-- events) and set to VOICE/SMS/DATA only for the new usage-scoped rows
-- this migration adds.
ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS usage_type VARCHAR(10);

-- `rate` is a true fraction (0.0600 = 6%), the exact convention the
-- business requirement specifies for the usage-contribution feature and
-- for telecom_usage_events.contribution_rate below. Deliberately
-- separate from the pre-existing `rate_percent` (a percentage NUMBER —
-- 0.5000 meaning 0.5% — that telecom.service.ts/bank.service.ts already
-- divide by 100) rather than overloading that column with a second unit
-- convention: two real, already-distinct consuming code paths (the
-- existing purchase-contribution webhook and the future usage-
-- contribution webhook), each reading the column shape natural to it.
-- Both are populated on the 3 new rows so either convention resolves
-- to the identical 6% value.
ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS rate NUMERIC(6,4);

ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'TZS';

-- Pairs with the pre-existing `effective_date` (left untouched/
-- unrenamed to avoid touching the 2 existing call sites that already
-- query it — a conservative choice, noted in the implementation
-- report) which continues to serve as the "effective from" boundary
-- for every rule, old and new alike.
ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS effective_to DATE;

UPDATE contribution_rules SET channel = 'TELECOM'
    WHERE rule_type IN ('Airtime', 'Data Bundle', 'Mobile Money Transfer') AND channel IS NULL;
UPDATE contribution_rules SET channel = 'BANK'
    WHERE rule_type = 'Bank Transfer' AND channel IS NULL;

-- The 6% usage-based rules. rule_type mirrors usage_type verbatim so
-- the existing `WHERE rule_type = $1` lookup pattern already used by
-- TelecomService/BankService works unchanged for a future usage-webhook
-- handler that follows the same convention. minimum_amount = 0 — unlike
-- the purchase-based rules, nothing in the business requirement
-- describes a minimum qualifying usage value, so 0 honestly represents
-- "no minimum" rather than borrowing the unrelated 1.00 default.
INSERT INTO contribution_rules
    (rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, usage_type, currency)
SELECT * FROM (VALUES
    ('VOICE', 6.0000, 0.0600, 0.00, CURRENT_DATE, TRUE, 'TELECOM', 'VOICE', 'TZS'),
    ('SMS',   6.0000, 0.0600, 0.00, CURRENT_DATE, TRUE, 'TELECOM', 'SMS',   'TZS'),
    ('DATA',  6.0000, 0.0600, 0.00, CURRENT_DATE, TRUE, 'TELECOM', 'DATA',  'TZS')
) AS seed(rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, usage_type, currency)
WHERE NOT EXISTS (
    SELECT 1 FROM contribution_rules cr
    WHERE cr.rule_type = seed.rule_type AND cr.usage_type = seed.usage_type
);

-- ============================================================
-- TELECOM_USAGE_EVENTS — new table
-- ============================================================

CREATE TABLE IF NOT EXISTS telecom_usage_events (
    usage_event_id SERIAL PRIMARY KEY,

    external_transaction_id VARCHAR(150) NOT NULL,

    -- NULL when the phone number cannot be confidently matched to a
    -- registered member (status = 'PENDING_REVIEW') — the wallet must
    -- never be credited in that case. phone_number is kept even when
    -- unmatched so reconciliation staff can see exactly what number
    -- needs manual linking; phone_id is the resolved match once known.
    member_id INT REFERENCES users(user_id),
    phone_number VARCHAR(20) NOT NULL,
    phone_id INT REFERENCES phone_numbers(phone_id),
    telecom_operator_id INT NOT NULL REFERENCES telecom_operators(operator_id),

    usage_type VARCHAR(10) NOT NULL CHECK (usage_type IN ('VOICE', 'SMS', 'DATA')),

    -- NUMERIC, not INT: voice minutes in particular can be fractional
    -- (e.g. a 10.5-minute call) depending on what the operator reports.
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('MINUTES', 'SMS', 'MB')),

    -- The qualifying value the OPERATOR assigns to this specific usage
    -- — never derived from an unrelated airtime-purchase/balance figure
    -- (the business rule's core distinction). NUMERIC per the financial-
    -- precision requirement — no floating point anywhere in this chain.
    monetary_value_tzs NUMERIC(18,2) NOT NULL CHECK (monetary_value_tzs >= 0),

    -- A snapshot of the rate actually applied (from contribution_rules
    -- .rate at processing time), not a live join — so this row stays
    -- historically accurate even if the configured rate changes later.
    -- Exact type/value convention (fraction, e.g. 0.0600) specified by
    -- the business requirement.
    contribution_rate NUMERIC(5,4) NOT NULL CHECK (contribution_rate >= 0),
    contribution_amount_tzs NUMERIC(18,2) NOT NULL CHECK (contribution_amount_tzs >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'TZS',

    -- When the usage itself occurred, per the provider — distinct from
    -- created_at (when TUJITUNZE persisted this row).
    usage_timestamp TIMESTAMP NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW')),

    provider_reference VARCHAR(150),

    -- Set once a future usage-webhook handler creates the corresponding
    -- telecom_contributions ledger row from a SUCCESSFUL usage event —
    -- the literal "usage event -> contribution ledger" link. No schema
    -- change needed on telecom_contributions itself (see header note).
    contribution_id INT REFERENCES telecom_contributions(contribution_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- No DB trigger, matching this schema's existing convention
    -- (verified: zero triggers exist anywhere today) — maintained by
    -- explicit `SET updated_at = NOW()` in application code, same as
    -- every other updated_at column in this project.
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Idempotency key exactly as specified: the same usage event resent by
-- the same operator, for the same usage type, must resolve to the same
-- row rather than creating a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS idx_telecom_usage_events_idempotency
    ON telecom_usage_events(telecom_operator_id, external_transaction_id, usage_type);

CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_member ON telecom_usage_events(member_id);
CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_status ON telecom_usage_events(status);
CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_usage_type ON telecom_usage_events(usage_type);
CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_timestamp ON telecom_usage_events(usage_timestamp);
CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_contribution ON telecom_usage_events(contribution_id);
CREATE INDEX IF NOT EXISTS idx_telecom_usage_events_operator ON telecom_usage_events(telecom_operator_id);

COMMIT;
