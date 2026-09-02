-- ============================================================
-- Migration 0025
-- DUAL-MODE MICRO-SAVINGS ENGINE — replaces the removed "Model B"
-- usage-contribution feature (migrations 0019/0020, removed by 0024)
-- with the design in the accompanying design document.
--
-- Principle 1 (RESOURCE_CONVERSION): a member converting airtime into a
-- voice/data/SMS bundle has a configured share of the RESOURCE itself
-- held back at the moment of conversion — not consumption — and only
-- the remainder is provisioned. telecom_resource_conversions captures
-- this event.
--
-- Principle 2 (TRANSACTION_DIVERSION): a member's outgoing mobile-money
-- transaction (Tuma / Lipa Namba / Toa / Bill Payment) settles in full;
-- separately, a small share of it is diverted to the Health Wallet,
-- funded from the channel's own transaction margin, never from the
-- member's payment. outgoing_transaction_diversions captures this
-- event. THIS PASS ONLY WIRES TELECOM-OPERATOR-AUTHENTICATED INTAKE
-- (provider_type='TELECOM') — mobile money in Tanzania is telecom-
-- operated (M-Pesa/Airtel Money/Tigo Pesa), so this covers the
-- dominant real case; bank- and switch-authenticated intake (Selcom)
-- is deferred pending their own credential-issuance design, same as
-- any other explicitly-deferred piece in this codebase. The schema
-- still models provider_type/bank_id/switch_provider generically so
-- that later work is additive, not a rewrite.
--
-- contribution_rules is extended (not duplicated) with `principle` and
-- `transaction_type`, following the exact precedent 0019 set for its
-- own columns. Principle 2's seed rows start is_active = FALSE: their
-- funding_source assumes a revenue-share agreement with the relevant
-- switch/operator that does not exist yet (see design doc §09) — going
-- active is a business decision, not a schema one.
--
-- saving_ledger unifies both principles into one audit-append-only
-- table, the one genuinely new cross-cutting concept this feature
-- needed that neither existing table already was.
-- ============================================================

BEGIN;

-- ============================================================
-- CONTRIBUTION_RULES — extended again, same precedent as 0019
-- ============================================================

ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS principle VARCHAR(24);
ALTER TABLE contribution_rules ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20);

INSERT INTO contribution_rules
    (rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, principle)
SELECT * FROM (VALUES
    ('VOICE', 10.0000, 0.1000, 0.00, CURRENT_DATE, TRUE, 'TELECOM_RESOURCE', 'RESOURCE_CONVERSION'),
    ('DATA',   8.0000, 0.0800, 0.00, CURRENT_DATE, TRUE, 'TELECOM_RESOURCE', 'RESOURCE_CONVERSION'),
    ('SMS',   10.0000, 0.1000, 0.00, CURRENT_DATE, TRUE, 'TELECOM_RESOURCE', 'RESOURCE_CONVERSION')
) AS seed(rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, principle)
WHERE NOT EXISTS (
    SELECT 1 FROM contribution_rules cr
    WHERE cr.rule_type = seed.rule_type AND cr.principle = seed.principle
);

-- Deliberately is_active = FALSE — see header note. rule_type doubles
-- as transaction_type here (mirrors 0019's rule_type=usage_type choice
-- for the same reason: the existing `WHERE rule_type = $1` lookup
-- shape keeps working unchanged for a handler that follows convention).
INSERT INTO contribution_rules
    (rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, principle, transaction_type)
SELECT * FROM (VALUES
    ('TUMA',         1.0000, 0.0100, 0.00, CURRENT_DATE, FALSE, 'MOBILE_MONEY_OUT', 'TRANSACTION_DIVERSION', 'TUMA'),
    ('LIPA_NAMBA',   1.5000, 0.0150, 0.00, CURRENT_DATE, FALSE, 'MOBILE_MONEY_OUT', 'TRANSACTION_DIVERSION', 'LIPA_NAMBA'),
    ('TOA',          1.0000, 0.0100, 0.00, CURRENT_DATE, FALSE, 'MOBILE_MONEY_OUT', 'TRANSACTION_DIVERSION', 'TOA'),
    ('BILL_PAYMENT', 2.0000, 0.0200, 0.00, CURRENT_DATE, FALSE, 'MOBILE_MONEY_OUT', 'TRANSACTION_DIVERSION', 'BILL_PAYMENT')
) AS seed(rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, principle, transaction_type)
WHERE NOT EXISTS (
    SELECT 1 FROM contribution_rules cr
    WHERE cr.rule_type = seed.rule_type AND cr.principle = seed.principle
);

-- ============================================================
-- TELECOM_RESOURCE_CONVERSIONS — Principle 1 event capture
-- ============================================================

CREATE TABLE IF NOT EXISTS telecom_resource_conversions (
    conversion_id SERIAL PRIMARY KEY,

    external_transaction_id VARCHAR(150) NOT NULL,

    member_id INT REFERENCES users(user_id),
    phone_number VARCHAR(20) NOT NULL,
    phone_id INT REFERENCES phone_numbers(phone_id),
    telecom_operator_id INT NOT NULL REFERENCES telecom_operators(operator_id),

    resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('VOICE', 'DATA', 'SMS')),
    gross_units NUMERIC(12,2) NOT NULL CHECK (gross_units > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('MINUTES', 'MB', 'SMS')),

    saving_rate NUMERIC(6,4) NOT NULL CHECK (saving_rate >= 0),
    saved_units NUMERIC(12,2) NOT NULL CHECK (saved_units >= 0),
    net_units_to_customer NUMERIC(12,2) NOT NULL CHECK (net_units_to_customer >= 0),

    -- Operator-authorized — this table never invents a price, same
    -- invariant the removed feature enforced, now on the column this
    -- design actually needs it on.
    provider_unit_value_tzs NUMERIC(12,2) NOT NULL CHECK (provider_unit_value_tzs >= 0),
    saved_value_tzs NUMERIC(18,2) NOT NULL CHECK (saved_value_tzs >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'TZS',

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW')),

    contribution_id INT REFERENCES telecom_contributions(contribution_id),

    conversion_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_conversions_idempotency
    ON telecom_resource_conversions(telecom_operator_id, external_transaction_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_conversions_member ON telecom_resource_conversions(member_id);
CREATE INDEX IF NOT EXISTS idx_resource_conversions_status ON telecom_resource_conversions(status);
CREATE INDEX IF NOT EXISTS idx_resource_conversions_operator ON telecom_resource_conversions(telecom_operator_id);

-- ============================================================
-- OUTGOING_TRANSACTION_DIVERSIONS — Principle 2 event capture
-- ============================================================

CREATE TABLE IF NOT EXISTS outgoing_transaction_diversions (
    diversion_id SERIAL PRIMARY KEY,

    external_transaction_id VARCHAR(150) NOT NULL,

    member_id INT REFERENCES users(user_id),
    phone_number VARCHAR(20) NOT NULL,
    phone_id INT REFERENCES phone_numbers(phone_id),

    provider_type VARCHAR(10) NOT NULL CHECK (provider_type IN ('TELECOM', 'BANK', 'SWITCH')),
    telecom_operator_id INT REFERENCES telecom_operators(operator_id),
    bank_id INT REFERENCES banks(bank_id),
    switch_provider VARCHAR(50),

    -- Exactly one of the three provider references is set, matching
    -- provider_type — mirrors payment_transactions' identical
    -- telecom_operator_id/bank_id mutual-exclusivity CHECK (0018).
    CHECK (
        (provider_type = 'TELECOM' AND telecom_operator_id IS NOT NULL AND bank_id IS NULL)
        OR (provider_type = 'BANK' AND bank_id IS NOT NULL AND telecom_operator_id IS NULL)
        OR (provider_type = 'SWITCH' AND switch_provider IS NOT NULL AND telecom_operator_id IS NULL AND bank_id IS NULL)
    ),

    transaction_type VARCHAR(20) NOT NULL
        CHECK (transaction_type IN ('TUMA', 'LIPA_NAMBA', 'TOA', 'BILL_PAYMENT')),
    gross_amount_tzs NUMERIC(18,2) NOT NULL CHECK (gross_amount_tzs > 0),

    saving_rate NUMERIC(6,4) NOT NULL CHECK (saving_rate >= 0),
    saved_amount_tzs NUMERIC(18,2) NOT NULL CHECK (saved_amount_tzs >= 0),
    -- Documents the credit was never withheld from gross_amount_tzs —
    -- see design doc §09 on the commercial agreement this assumes.
    funding_source VARCHAR(30) NOT NULL DEFAULT 'INTERCHANGE_SHARE',

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW')),

    contribution_id INT REFERENCES telecom_contributions(contribution_id),

    transaction_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_diversions_idempotency
    ON outgoing_transaction_diversions(
        provider_type, COALESCE(telecom_operator_id, 0), COALESCE(bank_id, 0),
        COALESCE(switch_provider, ''), external_transaction_id, transaction_type
    );
CREATE INDEX IF NOT EXISTS idx_diversions_member ON outgoing_transaction_diversions(member_id);
CREATE INDEX IF NOT EXISTS idx_diversions_status ON outgoing_transaction_diversions(status);

-- ============================================================
-- SAVING_LEDGER — unified audit trail across both principles
-- ============================================================

CREATE TABLE IF NOT EXISTS saving_ledger (
    ledger_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES users(user_id),

    principle VARCHAR(24) NOT NULL
        CHECK (principle IN ('RESOURCE_CONVERSION', 'TRANSACTION_DIVERSION')),
    source_table VARCHAR(40) NOT NULL,
    source_id INT NOT NULL,

    contribution_id INT REFERENCES telecom_contributions(contribution_id),
    wallet_transaction_id INT REFERENCES wallet_transactions(wallet_transaction_id),
    rule_id INT REFERENCES contribution_rules(rule_id),

    saved_value_tzs NUMERIC(18,2) NOT NULL CHECK (saved_value_tzs >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saving_ledger_member ON saving_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_saving_ledger_principle ON saving_ledger(principle);
CREATE INDEX IF NOT EXISTS idx_saving_ledger_source ON saving_ledger(source_table, source_id);

COMMIT;
