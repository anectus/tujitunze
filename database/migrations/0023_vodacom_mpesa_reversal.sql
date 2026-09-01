BEGIN;

-- A payment can have at most one reversal request. This closes the
-- check-then-insert race between two administrative requests.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_one_vodacom_reversal
    ON payment_transactions(reversal_reference)
    WHERE transaction_type = 'REVERSAL' AND reversal_reference IS NOT NULL;

COMMIT;
