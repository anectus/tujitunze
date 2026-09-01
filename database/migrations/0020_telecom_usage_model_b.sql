-- ============================================================
-- Migration 0020
-- MODEL B — corrects telecom_usage_events (migration 0019) to the
-- revised business model: TUJITUNZE does NOT compute 6% of a monetary
-- value. It computes 6% of the USAGE QUANTITY itself (minutes/SMS/MB),
-- producing a contribution quantity in the SAME unit, and only converts
-- that contribution quantity to TZS using a value the TELECOM PROVIDER
-- explicitly authorizes — TUJITUNZE never invents a per-MB/per-SMS/
-- per-minute price (see the "NO INVENTED PRICING" business rule).
--
-- Old (0019) formula:  monetary_value_tzs * contribution_rate = contribution_amount_tzs
-- New (Model B) formula: quantity * contribution_rate = contribution_quantity
--                         contribution_quantity -> (provider-authorized) -> provider_valuation_tzs
--
-- telecom_usage_events was created in 0019 and has never been wired
-- into any application code and holds zero rows (verified live
-- immediately before writing this migration) — correcting it in place
-- is a safe, non-destructive schema fix, not an alteration of anything
-- in production use. Creating a second table instead would be exactly
-- the kind of duplication the brief explicitly warns against.
--
-- contribution_rules needs NO change for this model revision: the rate
-- itself is still 6% (rule_type IN ('VOICE','SMS','DATA'), rate=0.0600,
-- rate_percent=6.0000, seeded in 0019) — only WHAT the rate is applied
-- to changes (quantity, not a monetary value), which is an application-
-- layer concern, not a schema one.
--
-- No other table (telecom_contributions, wallet_transactions,
-- insurance_allocations) needs any change — telecom_contributions
-- .contribution_amount will simply hold whatever TZS value
-- provider_valuation_tzs resolves to, once wiring exists (still
-- explicitly deferred).
-- ============================================================

BEGIN;

-- No longer part of the model — 6% is no longer computed from a
-- monetary value.
ALTER TABLE telecom_usage_events DROP COLUMN IF EXISTS monetary_value_tzs;

-- Same underlying concept (the TZS value attached to this row) as
-- before, but now explicitly the PROVIDER-AUTHORIZED valuation of the
-- contribution quantity specifically — not a TUJITUNZE-computed
-- percentage of a monetary amount. Renamed rather than dropped+re-added
-- to preserve the column's existing FK-free, standalone nature and its
-- position in the table without disruption.
ALTER TABLE telecom_usage_events RENAME COLUMN contribution_amount_tzs TO provider_valuation_tzs;
ALTER TABLE telecom_usage_events RENAME CONSTRAINT telecom_usage_events_contribution_amount_tzs_check
    TO telecom_usage_events_provider_valuation_tzs_check;

-- Nullable: the business rule is explicit that TUJITUNZE must not
-- invent this value — a usage event may legitimately arrive with a
-- known contribution_quantity before the provider has supplied (or if
-- the provider cannot supply) its authorized TZS valuation. The CHECK
-- constraint below is what actually enforces "never credit the wallet
-- without a real valuation", not a NOT NULL on this column.
ALTER TABLE telecom_usage_events ALTER COLUMN provider_valuation_tzs DROP NOT NULL;

-- The 6% CONTRIBUTION QUANTITY — same unit as `quantity` (e.g.
-- quantity=1000 MB, contribution_quantity=60 MB). This is the new
-- core calculated value Model B introduces; NOT NULL is safe to add
-- directly since the table holds zero rows.
ALTER TABLE telecom_usage_events ADD COLUMN IF NOT EXISTS contribution_quantity NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (contribution_quantity > 0);
ALTER TABLE telecom_usage_events ALTER COLUMN contribution_quantity DROP DEFAULT;

-- Provider-specific extra context (sponsorship/contribution mechanism
-- details, tariff/bundle info, etc.) — same JSONB pattern
-- payment_transactions.metadata (migration 0018) already established,
-- reused rather than reinvented.
ALTER TABLE telecom_usage_events ADD COLUMN IF NOT EXISTS metadata JSONB;

-- The actual enforcement of "the wallet must never be credited without
-- a real, provider-authorized valuation": a row can only reach
-- SUCCESSFUL status if provider_valuation_tzs is populated. PENDING /
-- PENDING_REVIEW / FAILED / REVERSED all remain valid with a NULL
-- valuation (e.g. still awaiting the provider's authorized figure).
ALTER TABLE telecom_usage_events
    ADD CONSTRAINT telecom_usage_events_valuation_required_for_success
    CHECK (status != 'SUCCESSFUL' OR provider_valuation_tzs IS NOT NULL);

COMMIT;
