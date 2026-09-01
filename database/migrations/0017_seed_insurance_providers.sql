-- ============================================================
-- Migration 0017
-- Seeds three real insurance companies so the Insurance dashboard
-- (STEP 8) and Member's plan-enrollment flow have real named providers
-- to work with, mirroring how telecom_operators/banks were seeded
-- directly with real Tanzanian operator/bank names in
-- database/schema/tujitunze.sql — insurance_providers had no equivalent
-- seed. No existing rows are touched; WHERE NOT EXISTS keyed on
-- provider_name (already UNIQUE) makes this safe to re-run.
-- ============================================================

BEGIN;

INSERT INTO insurance_providers (provider_name, license_number, contact_phone, contact_email, status)
SELECT * FROM (VALUES
    ('NHIF', 'TZ-INS-NHIF-001', '0800110022', 'info@nhif.or.tz', 'Active'),
    ('Diamond Trust Insurance', 'TZ-INS-DIAMOND-001', '0222123456', 'info@diamondtrust.co.tz', 'Active'),
    ('Jubilee Insurance', 'TZ-INS-JUBILEE-001', '0222138111', 'info@jubileeinsurance.co.tz', 'Active')
) AS seed(provider_name, license_number, contact_phone, contact_email, status)
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_providers ip WHERE ip.provider_name = seed.provider_name
);

-- One starter plan per provider, matching the shape
-- members.service.ts/insurance.service.ts already expect
-- (coverage_amount, premium_amount, status) — plan_code kept unique
-- per provider so a re-run doesn't duplicate it.
INSERT INTO insurance_plans (provider_id, plan_name, plan_code, description, premium_amount, coverage_amount, duration_months, status)
SELECT ip.provider_id, plan.plan_name, plan.plan_code, plan.description,
       plan.premium_amount, plan.coverage_amount, plan.duration_months, 'Active'
FROM insurance_providers ip
JOIN (VALUES
    ('NHIF', 'NHIF Standard Cover', 'NHIF-STD', 'National Health Insurance Fund standard cover for TUJITUNZE members.', 50000.00, 1000000.00, 12),
    ('Diamond Trust Insurance', 'Diamond Family Health Plan', 'DIAMOND-FAM', 'Diamond Trust Insurance family health cover for TUJITUNZE members.', 75000.00, 1500000.00, 12),
    ('Jubilee Insurance', 'Jubilee Afya Bora Plan', 'JUBILEE-AFYA', 'Jubilee Insurance individual health cover for TUJITUNZE members.', 60000.00, 1200000.00, 12)
) AS plan(provider_name, plan_name, plan_code, description, premium_amount, coverage_amount, duration_months)
  ON plan.provider_name = ip.provider_name
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_plans p WHERE p.plan_code = plan.plan_code
);

COMMIT;
