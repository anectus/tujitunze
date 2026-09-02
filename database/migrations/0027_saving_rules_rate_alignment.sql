-- ============================================================
-- Migration 0027
-- Corrects 0025's seeded contribution_rules rates to match the
-- product spec confirmed 2026-09-02, and adds a labeled-but-inactive
-- INCOMING transaction_type slot for later use.
--
-- These rows are already editable at runtime via
-- /super-admin/saving-rules — this migration only fixes the *default*
-- values a fresh environment seeds, it does not add capability.
-- ============================================================

BEGIN;

UPDATE contribution_rules
SET rate_percent = 10.0000, rate = 0.1000
WHERE rule_type = 'DATA' AND principle = 'RESOURCE_CONVERSION';

UPDATE contribution_rules
SET rate_percent = 1.0000, rate = 0.0100
WHERE rule_type = 'LIPA_NAMBA' AND principle = 'TRANSACTION_DIVERSION';

UPDATE contribution_rules
SET rate_percent = 1.0000, rate = 0.0100
WHERE rule_type = 'BILL_PAYMENT' AND principle = 'TRANSACTION_DIVERSION';

-- INCOMING transactions: 0% by design (money coming in is never
-- diverted) — seeded inactive since there is still no operator-side
-- event that would ever call this rule; it exists only so the
-- transaction_type is a recognized value ahead of that integration.
ALTER TABLE outgoing_transaction_diversions DROP CONSTRAINT IF EXISTS outgoing_transaction_diversions_transaction_type_check;
ALTER TABLE outgoing_transaction_diversions ADD CONSTRAINT outgoing_transaction_diversions_transaction_type_check
    CHECK (transaction_type IN ('TUMA', 'LIPA_NAMBA', 'TOA', 'BILL_PAYMENT', 'INCOMING'));

INSERT INTO contribution_rules
    (rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, principle, transaction_type)
SELECT * FROM (VALUES
    ('INCOMING', 0.0000, 0.0000, 0.00, CURRENT_DATE, FALSE, 'MOBILE_MONEY_OUT', 'TRANSACTION_DIVERSION', 'INCOMING')
) AS seed(rule_type, rate_percent, rate, minimum_amount, effective_date, is_active, channel, principle, transaction_type)
WHERE NOT EXISTS (
    SELECT 1 FROM contribution_rules cr
    WHERE cr.rule_type = seed.rule_type AND cr.principle = seed.principle
);

COMMIT;
