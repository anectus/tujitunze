-- ============================================================
-- Migration 0015
-- Completes the insurance allocation workflow against the explicit
-- field/status spec from CLAUDE.md STEP 6: currency, a genuinely
-- separate allocation reference (distinct from the contribution's own
-- external/internal references), a real created-vs-completed timestamp
-- pair, and the fuller Pending/Processing/Allocated/Failed/Reversed
-- status vocabulary (previously Allocated/Reversed only) — the same
-- kind of extension migration 0014 already did for
-- telecom_contributions/bank_transactions.
--
-- No new table — insurance_allocations remains the single per-
-- contribution allocation ledger, joined to telecom_contributions /
-- bank_transactions via wallet_transactions exactly as already built.
-- This migration only extends that existing table. Confirmed empty in
-- the live database before this migration (checked directly), so
-- renames/NOT NULL changes are safe with no backfill. Safe to re-run.
-- ============================================================

BEGIN;

ALTER TABLE insurance_allocations
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'TZS';

-- "reference" already held a caller-supplied value (the contribution's
-- own transaction reference, duplicated) — renamed to make explicit
-- that this is now a distinct, TUJITUNZE-generated allocation-level
-- identifier (see WalletsService.generateAllocationReference()), one
-- more link in the traceability chain alongside the contribution's own
-- external/internal references, not a copy of either.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_allocations' AND column_name = 'reference'
  ) THEN
    ALTER TABLE insurance_allocations RENAME COLUMN reference TO allocation_reference;
  END IF;
END $$;

-- "allocated_at" was NOT NULL DEFAULT CURRENT_TIMESTAMP, i.e. always
-- equal to created_at at insert time (allocation was created already-
-- Allocated, synchronously). Renamed to completed_at and made nullable
-- so it can genuinely represent "when processing finished" for a row
-- that now spends real time (if only milliseconds) in Pending/
-- Processing first, and is NULL for a still-in-flight allocation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_allocations' AND column_name = 'allocated_at'
  ) THEN
    ALTER TABLE insurance_allocations RENAME COLUMN allocated_at TO completed_at;
  END IF;
END $$;

ALTER TABLE insurance_allocations ALTER COLUMN completed_at DROP NOT NULL;
ALTER TABLE insurance_allocations ALTER COLUMN completed_at DROP DEFAULT;

ALTER TABLE insurance_allocations ALTER COLUMN allocation_status SET DEFAULT 'Pending';

ALTER TABLE insurance_allocations
    DROP CONSTRAINT IF EXISTS insurance_allocations_allocation_status_check;

ALTER TABLE insurance_allocations
    ADD CONSTRAINT insurance_allocations_allocation_status_check
    CHECK (allocation_status IN ('Pending', 'Processing', 'Allocated', 'Failed', 'Reversed'));

CREATE INDEX IF NOT EXISTS idx_insurance_allocations_status
    ON insurance_allocations(allocation_status);

COMMIT;
