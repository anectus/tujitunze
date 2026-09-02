-- ============================================================
-- Migration 0024
-- REMOVES the "Model B" usage-quantity telecom contribution feature
-- introduced by migrations 0019/0020 (telecom_usage_events, and the
-- 3 seeded VOICE/SMS/DATA rows in contribution_rules), along with its
-- application code (TelecomService.handleUsageEventWebhook/
-- listUsageEvents/getUsageEvent/getUsageEventsSummary, the
-- POST /telecom/webhooks/usage webhook, telecom-usage-event.types.ts,
-- and the staff-facing GET /telecom/usage-events* routes/frontend
-- page).
--
-- Why: the actual product requirement (see the dual-mode micro-saving
-- system spec this replaces) needs Principle 1 (telecom resource
-- savings) framed around a bundle/resource CONVERSION event, not a
-- usage-CONSUMPTION event — Model B computed 6% of consumed VOICE/SMS/
-- DATA quantity, which is a related but distinct trigger from
-- "airtime converted into a bundle." Rather than layering a second,
-- overlapping mechanism on top of Model B, it is removed outright and
-- replaced by a fresh design (see the accompanying design document).
--
-- This is a forward (compensating) migration, not an edit to 0019/0020
-- themselves: those files already ran against this project's shared
-- dev database (docker-entrypoint-initdb.d only replays migrations
-- against a FRESH, empty Postgres volume — see database/docker-
-- initdb.sh), so rewriting their history would silently diverge from
-- what's actually running. Adding 0024 keeps a fresh setup and this
-- environment in sync via the same forward-only mechanism.
--
-- contribution_rules' generic columns added by 0019 (channel,
-- usage_type, rate, currency, effective_to) are INTENTIONALLY left in
-- place — they're reusable, harmless when NULL/unused, and the new
-- design may reuse this same table for its own rule rows rather than
-- duplicating a rules table. Only the 3 Model-B-specific seeded rows
-- are removed.
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS telecom_usage_events CASCADE;

DELETE FROM contribution_rules
    WHERE channel = 'TELECOM' AND usage_type IN ('VOICE', 'SMS', 'DATA');

COMMIT;
