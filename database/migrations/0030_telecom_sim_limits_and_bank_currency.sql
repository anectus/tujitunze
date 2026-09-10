-- ============================================================
-- Migration 0030
-- Adds the fields two per-member account rules need:
--
-- 1. TCRA-aligned SIM limits: standard mobile-money numbers are capped
--    at one active SIM per operator per NIDA; M2M (IoT/router/tracking)
--    SIMs are allowed up to four per operator, and must say so
--    explicitly. `phone_numbers.sim_type` records which kind a row is;
--    the actual "1 standard / 4 M2M" cap is enforced in
--    MembersService.addPhoneNumber/reactivatePhoneNumber (application
--    layer), the same place every other per-member account rule in this
--    module already lives (bank account uniqueness below, membership
--    completion, saving-consent gating) — not a DB constraint. A hard
--    partial-unique index was considered and rejected here: this
--    database already has a pre-existing violation (user_id 1658 has
--    two concurrently Active Halotel numbers, phone_id 502/503, from
--    testing before this rule existed) that a same-migration unique
--    index would fail against. Retroactively deciding which of those
--    rows is "wrong" isn't this migration's call to make, so the schema
--    stays permissive and the new rule applies going forward via the
--    service layer only, consistent with how every other business rule
--    here is enforced.
--
-- 2. Bank account products: `currency` (a bank account previously had
--    no currency at all) and `account_capacity` (Individual/Joint) so
--    "NMB Savings TZS" and "NMB Savings USD" can coexist as distinct,
--    real accounts instead of colliding on bankId+accountType alone.
-- ============================================================

BEGIN;

ALTER TABLE phone_numbers
    ADD COLUMN sim_type VARCHAR(20) NOT NULL DEFAULT 'Standard'
        CHECK (sim_type IN ('Standard', 'M2M'));

COMMENT ON COLUMN phone_numbers.sim_type IS
    'Standard: one active SIM per operator per NIDA. M2M: up to four active SIMs per operator, for IoT/router/tracking devices. Cap enforced in MembersService, not a DB constraint — see migration 0030 header.';

ALTER TABLE member_bank_accounts
    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TZS'
        CHECK (currency IN ('TZS', 'USD')),
    ADD COLUMN account_capacity VARCHAR(20) NOT NULL DEFAULT 'Individual'
        CHECK (account_capacity IN ('Individual', 'Joint'));

COMMENT ON COLUMN member_bank_accounts.currency IS
    'Part of the per-bank product uniqueness key (bankId + accountType + currency + accountCapacity) enforced in MembersService.addBankAccount/reactivateBankAccount.';

COMMENT ON COLUMN member_bank_accounts.account_capacity IS
    'Individual vs Joint. Part of the per-bank product uniqueness key alongside currency — see the currency column comment.';

COMMIT;
