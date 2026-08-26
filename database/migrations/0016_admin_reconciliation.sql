-- ============================================================
-- Migration 0016
-- Backs STEP 7's Admin-facing, cross-channel financial reconciliation:
--
--   EXTERNAL TRANSACTION -> TUJITUNZE CONTRIBUTION -> INSURANCE ALLOCATION
--
-- Distinct from (and not a duplicate of) the existing per-channel,
-- tenant-scoped telecom_reconciliation_runs/records and
-- bank_reconciliation_runs/records: those let a Telecom operator or Bank
-- reconcile their OWN uploaded batch against their OWN contributions/
-- transactions only, with a binary Matched/Unmatched (or 3-way, for
-- Bank) outcome, and never look at insurance_allocations at all. This is
-- an Admin tool that spans BOTH channels in one run, reaches one hop
-- further into insurance_allocations, and distinguishes 8 specific
-- problem categories (see the CHECK constraint below) rather than a
-- binary match/no-match.
--
-- No changes to telecom_contributions / bank_transactions /
-- insurance_allocations / wallet_transactions — those remain the sole
-- source of truth being reconciled against; this table only records the
-- computed result of checking an externally-reported transaction
-- against them. Safe to re-run.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS admin_reconciliation_runs (
    run_id SERIAL PRIMARY KEY,

    initiated_by INT
        REFERENCES users(user_id),

    total_records INT NOT NULL DEFAULT 0,
    matched_count INT NOT NULL DEFAULT 0,
    exception_count INT NOT NULL DEFAULT 0,

    run_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_reconciliation_records (
    record_id SERIAL PRIMARY KEY,

    run_id INT NOT NULL
        REFERENCES admin_reconciliation_runs(run_id)
        ON DELETE CASCADE,

    channel VARCHAR(20) NOT NULL
        CHECK (channel IN ('AIRTIME', 'BANK_TRANSFER')),

    external_reference VARCHAR(100) NOT NULL,
    external_amount DECIMAL(15,2),
    member_identifier VARCHAR(50),

    -- Traceability: which internal rows this external reference resolved
    -- to, if any (mirrors the wallet_transactions nullable-per-channel-FK
    -- pattern rather than inventing a new linkage shape).
    contribution_id INT
        REFERENCES telecom_contributions(contribution_id),
    bank_transaction_id INT
        REFERENCES bank_transactions(bank_transaction_id),
    allocation_id INT
        REFERENCES insurance_allocations(allocation_id),

    -- The seven explicit yes/no/n-a checks CLAUDE.md's STEP 7 requires
    -- Admin be able to determine for any given external transaction.
    -- NULL means "not applicable / not checked" (e.g. amount_matches is
    -- NULL when no contribution was found to compare against; member_
    -- matches is NULL when no member_identifier was supplied to check).
    external_transaction_exists BOOLEAN NOT NULL DEFAULT TRUE,
    contribution_exists BOOLEAN,
    amount_matches BOOLEAN,
    member_matches BOOLEAN,
    allocation_exists BOOLEAN,
    allocation_amount_matches BOOLEAN,
    already_processed BOOLEAN NOT NULL DEFAULT FALSE,

    reconciliation_status VARCHAR(30) NOT NULL
        CHECK (reconciliation_status IN (
            'Matched', 'Duplicate', 'Missing', 'Unknown',
            'UnknownMember', 'AmountMismatch', 'FailedAllocation',
            'Reversed', 'AlreadyProcessed'
        )),

    detail TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_reconciliation_records_run
    ON admin_reconciliation_records(run_id);
CREATE INDEX IF NOT EXISTS idx_admin_reconciliation_records_reference
    ON admin_reconciliation_records(channel, external_reference);
CREATE INDEX IF NOT EXISTS idx_admin_reconciliation_records_status
    ON admin_reconciliation_records(reconciliation_status);

COMMIT;
