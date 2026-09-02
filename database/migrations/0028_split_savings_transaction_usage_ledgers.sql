-- ============================================================
-- Migration 0028
-- Physically separates event-capture from split/calculation detail
-- for both micro-savings principles, per the user's explicit
-- "three separate ledgers — do not merge them" requirement (the
-- 2026-09-02 audit's literal reading, which migration 0026 had
-- deliberately not done — see CLAUDE.md for that earlier reasoning
-- and this migration's correction of it).
--
-- Principle 1 (RESOURCE_CONVERSION):
--   telecom_resource_conversions  -->  telecom_resource_conversion_events
--                                      (Transaction Ledger: the raw
--                                      inbound event, as reported)
--                                  +   telecom_resource_usage_splits
--                                      (Usage Ledger: the gross/customer/
--                                      saved split and its outcome)
--
-- Principle 2 (TRANSACTION_DIVERSION):
--   outgoing_transaction_diversions --> telecom_outgoing_transaction_events
--                                       (Transaction Ledger)
--                                   +   outgoing_transaction_savings
--                                       (Usage Ledger — same role as
--                                       telecom_resource_usage_splits;
--                                       named "savings" not "usage"
--                                       since there's no bundle/resource
--                                       being split here, only a
--                                       transaction amount being
--                                       assessed against a rule)
--
-- Each event row has exactly one split/savings row (event_id UNIQUE),
-- including the NO_ACTIVE_RULE/OPTED_OUT/SKIPPED zero-saving outcomes
-- migration 0026 made unconditional — this is a 1:1 relationship
-- today, modeled as genuinely separate tables/concerns rather than
-- collapsed into one, so a future outcome that legitimately needs
-- multiple detail rows per event (e.g. a partial reversal) has
-- somewhere to go without another schema rewrite.
--
-- saving_ledger (the cross-cutting Saving Ledger, added 0025) is
-- unchanged in shape — only its source_table values are repointed at
-- the new event tables, same source_id values (event_id was assigned
-- from the old table's PK below, so nothing there needed to change).
-- ============================================================

BEGIN;

-- ============================================================
-- PRINCIPLE 1 — split telecom_resource_conversions
-- ============================================================

CREATE TABLE telecom_resource_conversion_events (
    event_id SERIAL PRIMARY KEY,

    external_transaction_id VARCHAR(150) NOT NULL,

    member_id INT REFERENCES users(user_id),
    phone_number VARCHAR(20) NOT NULL,
    phone_id INT REFERENCES phone_numbers(phone_id),
    telecom_operator_id INT NOT NULL REFERENCES telecom_operators(operator_id),

    resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('VOICE', 'DATA', 'SMS')),
    gross_units NUMERIC(12,2) NOT NULL CHECK (gross_units > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('MINUTES', 'MB', 'SMS')),

    conversion_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_resource_conversion_events_idempotency
    ON telecom_resource_conversion_events(telecom_operator_id, external_transaction_id, resource_type);
CREATE INDEX idx_resource_conversion_events_member ON telecom_resource_conversion_events(member_id);
CREATE INDEX idx_resource_conversion_events_operator ON telecom_resource_conversion_events(telecom_operator_id);

CREATE TABLE telecom_resource_usage_splits (
    split_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL UNIQUE REFERENCES telecom_resource_conversion_events(event_id) ON DELETE CASCADE,

    saving_rate NUMERIC(6,4) NOT NULL CHECK (saving_rate >= 0),
    saved_units NUMERIC(12,2) NOT NULL CHECK (saved_units >= 0),
    net_units_to_customer NUMERIC(12,2) NOT NULL CHECK (net_units_to_customer >= 0),

    provider_unit_value_tzs NUMERIC(12,2) NOT NULL CHECK (provider_unit_value_tzs >= 0),
    saved_value_tzs NUMERIC(18,2) NOT NULL CHECK (saved_value_tzs >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'TZS',

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW', 'NO_ACTIVE_RULE', 'OPTED_OUT')),

    contribution_id INT REFERENCES telecom_contributions(contribution_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resource_usage_splits_status ON telecom_resource_usage_splits(status);

-- event_id is inserted explicitly (not left to its own SERIAL) so it
-- matches the source row's old conversion_id — this is what keeps
-- saving_ledger.source_id valid without a remap table below.
INSERT INTO telecom_resource_conversion_events
    (event_id, external_transaction_id, member_id, phone_number, phone_id, telecom_operator_id,
     resource_type, gross_units, unit, conversion_timestamp, created_at)
SELECT conversion_id, external_transaction_id, member_id, phone_number, phone_id, telecom_operator_id,
       resource_type, gross_units, unit, conversion_timestamp, created_at
FROM telecom_resource_conversions;

INSERT INTO telecom_resource_usage_splits
    (event_id, saving_rate, saved_units, net_units_to_customer, provider_unit_value_tzs,
     saved_value_tzs, currency, status, contribution_id, created_at, updated_at)
SELECT conversion_id, saving_rate, saved_units, net_units_to_customer, provider_unit_value_tzs,
       saved_value_tzs, currency, status, contribution_id, created_at, updated_at
FROM telecom_resource_conversions;

SELECT setval(
    pg_get_serial_sequence('telecom_resource_conversion_events', 'event_id'),
    COALESCE((SELECT MAX(event_id) FROM telecom_resource_conversion_events), 1),
    (SELECT MAX(event_id) FROM telecom_resource_conversion_events) IS NOT NULL
);

DO $$
DECLARE
    old_count INT;
    new_events_count INT;
    new_splits_count INT;
BEGIN
    SELECT COUNT(*) INTO old_count FROM telecom_resource_conversions;
    SELECT COUNT(*) INTO new_events_count FROM telecom_resource_conversion_events;
    SELECT COUNT(*) INTO new_splits_count FROM telecom_resource_usage_splits;

    IF old_count <> new_events_count OR old_count <> new_splits_count THEN
        RAISE EXCEPTION
            'telecom_resource_conversions migration row-count mismatch: old=%, events=%, splits=%',
            old_count, new_events_count, new_splits_count;
    END IF;
END $$;

UPDATE saving_ledger
SET source_table = 'telecom_resource_conversion_events'
WHERE source_table = 'telecom_resource_conversions';

DROP TABLE telecom_resource_conversions;

-- ============================================================
-- PRINCIPLE 2 — split outgoing_transaction_diversions
-- ============================================================

CREATE TABLE telecom_outgoing_transaction_events (
    event_id SERIAL PRIMARY KEY,

    external_transaction_id VARCHAR(150) NOT NULL,

    member_id INT REFERENCES users(user_id),
    phone_number VARCHAR(20) NOT NULL,
    phone_id INT REFERENCES phone_numbers(phone_id),

    provider_type VARCHAR(10) NOT NULL CHECK (provider_type IN ('TELECOM', 'BANK', 'SWITCH')),
    telecom_operator_id INT REFERENCES telecom_operators(operator_id),
    bank_id INT REFERENCES banks(bank_id),
    switch_provider VARCHAR(50),

    CHECK (
        (provider_type = 'TELECOM' AND telecom_operator_id IS NOT NULL AND bank_id IS NULL)
        OR (provider_type = 'BANK' AND bank_id IS NOT NULL AND telecom_operator_id IS NULL)
        OR (provider_type = 'SWITCH' AND switch_provider IS NOT NULL AND telecom_operator_id IS NULL AND bank_id IS NULL)
    ),

    transaction_type VARCHAR(20) NOT NULL
        CHECK (transaction_type IN ('TUMA', 'LIPA_NAMBA', 'TOA', 'BILL_PAYMENT', 'INCOMING')),
    gross_amount_tzs NUMERIC(18,2) NOT NULL CHECK (gross_amount_tzs > 0),

    transaction_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_outgoing_transaction_events_idempotency
    ON telecom_outgoing_transaction_events(
        provider_type, COALESCE(telecom_operator_id, 0), COALESCE(bank_id, 0),
        COALESCE(switch_provider, ''), external_transaction_id, transaction_type
    );
CREATE INDEX idx_outgoing_transaction_events_member ON telecom_outgoing_transaction_events(member_id);

CREATE TABLE outgoing_transaction_savings (
    saving_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL UNIQUE REFERENCES telecom_outgoing_transaction_events(event_id) ON DELETE CASCADE,

    saving_rate NUMERIC(6,4) NOT NULL CHECK (saving_rate >= 0),
    saved_amount_tzs NUMERIC(18,2) NOT NULL CHECK (saved_amount_tzs >= 0),
    funding_source VARCHAR(30) NOT NULL DEFAULT 'INTERCHANGE_SHARE',

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'PENDING_REVIEW', 'SKIPPED', 'OPTED_OUT')),

    contribution_id INT REFERENCES telecom_contributions(contribution_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_outgoing_transaction_savings_status ON outgoing_transaction_savings(status);

INSERT INTO telecom_outgoing_transaction_events
    (event_id, external_transaction_id, member_id, phone_number, phone_id, provider_type,
     telecom_operator_id, bank_id, switch_provider, transaction_type, gross_amount_tzs,
     transaction_timestamp, created_at)
SELECT diversion_id, external_transaction_id, member_id, phone_number, phone_id, provider_type,
       telecom_operator_id, bank_id, switch_provider, transaction_type, gross_amount_tzs,
       transaction_timestamp, created_at
FROM outgoing_transaction_diversions;

INSERT INTO outgoing_transaction_savings
    (event_id, saving_rate, saved_amount_tzs, funding_source, status, contribution_id, created_at, updated_at)
SELECT diversion_id, saving_rate, saved_amount_tzs, funding_source, status, contribution_id, created_at, updated_at
FROM outgoing_transaction_diversions;

SELECT setval(
    pg_get_serial_sequence('telecom_outgoing_transaction_events', 'event_id'),
    COALESCE((SELECT MAX(event_id) FROM telecom_outgoing_transaction_events), 1),
    (SELECT MAX(event_id) FROM telecom_outgoing_transaction_events) IS NOT NULL
);

DO $$
DECLARE
    old_count INT;
    new_events_count INT;
    new_savings_count INT;
BEGIN
    SELECT COUNT(*) INTO old_count FROM outgoing_transaction_diversions;
    SELECT COUNT(*) INTO new_events_count FROM telecom_outgoing_transaction_events;
    SELECT COUNT(*) INTO new_savings_count FROM outgoing_transaction_savings;

    IF old_count <> new_events_count OR old_count <> new_savings_count THEN
        RAISE EXCEPTION
            'outgoing_transaction_diversions migration row-count mismatch: old=%, events=%, savings=%',
            old_count, new_events_count, new_savings_count;
    END IF;
END $$;

UPDATE saving_ledger
SET source_table = 'telecom_outgoing_transaction_events'
WHERE source_table = 'outgoing_transaction_diversions';

DROP TABLE outgoing_transaction_diversions;

COMMIT;
