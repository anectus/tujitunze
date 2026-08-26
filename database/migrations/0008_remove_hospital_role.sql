-- ============================================================
-- Migration 0008
-- Business-model change: Tujitunze no longer pays hospitals directly.
-- Contributions collected via Bank/Mobile Money/Telecom flow through
-- the Contribution Engine into the Member's Health Fund and are then
-- allocated to a Health Insurance Company. Hospital is removed as a
-- platform role/tenant entirely — no more Hospital staff accounts,
-- no more Admin-managed hospital directory growth, no more
-- Hospital-authored writes to claims/verifications/treatments/payments.
--
-- What this migration does NOT touch, deliberately: `hospitals`,
-- `healthcare_claims`, `healthcare_verifications`, `treatments`, and
-- `hospital_payments` are all left exactly as they are. They become
-- frozen historical/reference data — every existing row (and the
-- hospital name it points at) stays readable by Member and now by
-- Insurance, they just have no more write path once the Hospital
-- module is gone from the codebase. Dropping/altering those tables is
-- explicitly out of scope for this migration.
--
-- Safe to re-run (IF EXISTS / IF NOT EXISTS throughout).
-- ============================================================

BEGIN;

-- ============================================================
-- ROLE / PERMISSION CLEANUP
-- ============================================================
-- role_permissions.permission_id and role_permissions.role_id both
-- CASCADE, and member_roles.role_id CASCADEs too (see tujitunze.sql
-- §2/§3c) — deleting the permission catalog rows and the Hospital role
-- row below is enough; no separate DELETE against role_permissions/
-- member_roles is needed.

-- Hospital-exclusive permissions (not shared with any other role) —
-- confirmed against the seed data in tujitunze.sql §29b/29c. Also
-- retires Member's "browse the hospital directory" and Admin's
-- "manage hospital records" permissions, since both surfaces are
-- removed alongside Hospital itself.
DELETE FROM permissions
WHERE permission_name IN (
    'patients:manage',
    'billing:manage',
    'appointments:manage',
    'hospital-staff:manage',
    'member-hospitals:view',
    'partner-hospitals:manage'
);

-- claims:manage / reports:view / settings:manage stay in the catalog
-- (shared with Admin and other roles) — only Hospital's link to them
-- goes away, via the role row's cascade below.
DELETE FROM roles WHERE role_name = 'Hospital';

-- ============================================================
-- STAFF TENANT LINK
-- ============================================================

ALTER TABLE users DROP COLUMN IF EXISTS hospital_id;

-- ============================================================
-- BANK SETTLEMENTS — Insurance replaces Hospital as a settlement
-- counterparty. Telecom is unaffected.
-- ============================================================

ALTER TABLE settlements DROP COLUMN IF EXISTS hospital_id;

ALTER TABLE settlements DROP CONSTRAINT IF EXISTS settlements_counterparty_type_check;

ALTER TABLE settlements ADD CONSTRAINT settlements_counterparty_type_check
    CHECK (counterparty_type IN ('Telecom', 'Insurance'));

ALTER TABLE settlements ADD COLUMN IF NOT EXISTS insurance_provider_id INT
    REFERENCES insurance_providers(provider_id);

COMMIT;
