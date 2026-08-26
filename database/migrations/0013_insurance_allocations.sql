-- ============================================================
-- Migration 0013
-- Closes the two real gaps left after the Airtime/Bank-Transfer
-- contribution channels shipped: (1) a formal PENDING/CONFIRMED/FAILED/
-- REVERSED status vocabulary on both channel tables (previously free
-- text — 'Processed'/'Completed' were being written ad hoc), and (2)
-- genuine per-contribution insurance-allocation traceability.
--
-- Traceability design: insurance_allocations links to
-- wallet_transactions, NOT to telecom_contributions/bank_transactions
-- directly. wallet_transactions is already the single point both
-- channels converge on (it has contribution_id XOR bank_transaction_id
-- since the contribution feature shipped) — reusing it here means "one
-- allocation per contribution event" is enforced by a single UNIQUE
-- constraint regardless of which channel produced the event, instead of
-- needing two parallel nullable FK columns a second time.
--
-- Bank's existing `settlements` table is UNCHANGED and still the pooled,
-- bank-initiated payout mechanism — this migration adds a SEPARATE,
-- individual record so a specific member's specific contribution can be
-- traced to where it went, without disturbing that pooled model.
--
-- Both status tables are confirmed empty in the live database before
-- this migration adds their CHECK constraints (no existing rows to
-- violate). Safe to re-run (IF NOT EXISTS / DO blocks throughout).
-- ============================================================

BEGIN;

-- ============================================================
-- STATUS VOCABULARY
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'telecom_contributions_processing_status_check'
  ) THEN
    ALTER TABLE telecom_contributions
      ADD CONSTRAINT telecom_contributions_processing_status_check
      CHECK (processing_status IN ('Pending', 'Confirmed', 'Failed', 'Reversed'));
  END IF;
END $$;

-- bank_transactions.transaction_status is shared with the pre-existing
-- Deposit/Withdrawal approval lifecycle (Pending/Approved/Completed/
-- Failed, see UpdateTransactionStatusDto) as well as the newer
-- Contribution lifecycle — the constraint allows the union of both
-- rather than trying to split one column by transaction_type.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bank_transactions_transaction_status_check'
  ) THEN
    ALTER TABLE bank_transactions
      ADD CONSTRAINT bank_transactions_transaction_status_check
      CHECK (transaction_status IN ('Pending', 'Approved', 'Completed', 'Failed', 'Confirmed', 'Reversed'));
  END IF;
END $$;

-- ============================================================
-- INSURANCE ALLOCATIONS — per-contribution traceability
-- ============================================================

CREATE TABLE IF NOT EXISTS insurance_allocations (
    allocation_id SERIAL PRIMARY KEY,

    -- The one confirmed contribution event this allocation is for,
    -- regardless of whether it came from Airtime or Bank Transfer.
    -- UNIQUE enforces "a contribution can be allocated at most once."
    wallet_transaction_id INT NOT NULL UNIQUE
        REFERENCES wallet_transactions(wallet_transaction_id),

    member_id INT NOT NULL
        REFERENCES users(user_id),

    insurance_provider_id INT NOT NULL
        REFERENCES insurance_providers(provider_id),

    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),

    allocation_status VARCHAR(20) NOT NULL DEFAULT 'Allocated'
        CHECK (allocation_status IN ('Allocated', 'Reversed')),

    reference VARCHAR(100) UNIQUE,

    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_allocations_member
    ON insurance_allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_insurance_allocations_provider
    ON insurance_allocations(insurance_provider_id);

COMMIT;
