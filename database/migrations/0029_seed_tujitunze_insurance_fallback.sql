-- ============================================================
-- Migration 0029
-- Seeds "Tujitunze Insurance" — the platform's own fallback provider/
-- plan, auto-enrolled by WalletsService.creditContribution() for any
-- member whose contribution has no active policy to allocate to. Not a
-- real licensed external insurer (license_number/contact fields stay
-- NULL on purpose), and not billed a fixed premium the way the
-- migration-0017 providers are — this plan simply receives whatever a
-- member's own contributions allocate to it, which is why
-- premium_amount/coverage_amount/duration_months are left NULL rather
-- than an invented number. Mirrors 0017's idempotent
-- WHERE NOT EXISTS-on-unique-name pattern, safe to re-run.
-- ============================================================

BEGIN;

INSERT INTO insurance_providers (provider_name, status)
SELECT 'Tujitunze Insurance', 'Active'
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_providers WHERE provider_name = 'Tujitunze Insurance'
);

INSERT INTO insurance_plans (provider_id, plan_name, plan_code, description, status)
SELECT ip.provider_id,
       'Tujitunze Basic Cover',
       'TJZ-BASIC',
       'Automatic fallback cover for members with no other active insurance policy — funded entirely by the member''s own telecom/bank contributions as they are allocated, not a separately billed premium.',
       'Active'
FROM insurance_providers ip
WHERE ip.provider_name = 'Tujitunze Insurance'
  AND NOT EXISTS (
    SELECT 1 FROM insurance_plans p WHERE p.plan_code = 'TJZ-BASIC'
  );

COMMIT;
