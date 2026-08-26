-- ============================================================
-- Migration 0014
-- Completes the contribution ledger against the explicit field/status
-- spec: currency, a genuinely separate internal (TUJITUNZE-issued)
-- reference distinct from the external (Telecom/Bank-issued) one, a
-- created_at audit column on telecom_contributions to match
-- bank_transactions' existing created_at, and the fuller
-- Pending/Received/Validated/Allocated/Failed/Reversed status
-- vocabulary (previously Pending/Confirmed/Failed/Reversed).
--
-- No new contribution table — telecom_contributions and
-- bank_transactions remain the two channel ledgers, wallet_transactions
-- remains the cross-channel unifying ledger, exactly as already built.
-- This migration only extends those existing tables.
--
-- Both tables confirmed empty in the live database before this
-- migration (checked directly), so NOT NULL/UNIQUE columns can be added
-- directly with no backfill. Safe to re-run (IF NOT EXISTS throughout).
-- ============================================================

BEGIN;

-- ============================================================
-- TELECOM_CONTRIBUTIONS
-- ============================================================

ALTER TABLE telecom_contributions
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'TZS';

ALTER TABLE telecom_contributions
    ADD COLUMN IF NOT EXISTS internal_reference VARCHAR(100);

ALTER TABLE telecom_contributions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'telecom_contributions_internal_reference_key'
  ) THEN
    ALTER TABLE telecom_contributions
      ADD CONSTRAINT telecom_contributions_internal_reference_key UNIQUE (internal_reference);
  END IF;
END $$;

ALTER TABLE telecom_contributions
    DROP CONSTRAINT IF EXISTS telecom_contributions_processing_status_check;

ALTER TABLE telecom_contributions
    ADD CONSTRAINT telecom_contributions_processing_status_check
    CHECK (processing_status IN ('Pending', 'Received', 'Validated', 'Allocated', 'Failed', 'Reversed'));

-- ============================================================
-- BANK_TRANSACTIONS
-- ============================================================

ALTER TABLE bank_transactions
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'TZS';

ALTER TABLE bank_transactions
    ADD COLUMN IF NOT EXISTS internal_reference VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bank_transactions_internal_reference_key'
  ) THEN
    ALTER TABLE bank_transactions
      ADD CONSTRAINT bank_transactions_internal_reference_key UNIQUE (internal_reference);
  END IF;
END $$;

-- Union of the pre-existing Deposit/Withdrawal approval vocabulary
-- (Pending/Approved/Completed/Failed) with the Contribution lifecycle's
-- fuller vocabulary — this column is shared across both transaction
-- families (see 0013's note), not split by transaction_type.
ALTER TABLE bank_transactions
    DROP CONSTRAINT IF EXISTS bank_transactions_transaction_status_check;

ALTER TABLE bank_transactions
    ADD CONSTRAINT bank_transactions_transaction_status_check
    CHECK (transaction_status IN ('Pending', 'Approved', 'Completed', 'Failed', 'Received', 'Validated', 'Allocated', 'Reversed'));

COMMIT;
