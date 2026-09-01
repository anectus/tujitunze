-- ============================================================
-- Migration 0018
-- PHASE 2 — Payment Rail domain model.
--
-- Audit finding this migration addresses (see PHASE 1 report): today
-- telecom_contributions/bank_transactions conflate two distinct
-- concerns into one row — (a) "did the provider notify us of a
-- transaction, and what is its raw payment-lifecycle state" and
-- (b) "the confirmed TUJITUNZE contribution ledger entry". Their
-- processing_status/transaction_status vocabularies are workflow
-- stages (Pending/Received/Validated/Allocated/Failed/Reversed), not a
-- payment lifecycle (INITIATED/PENDING/SUCCESSFUL/FAILED/REVERSED/
-- REFUNDED/DISPUTED), and neither table has provider_timestamp vs
-- received_at vs processed_at, failure_reason, reversal_reference,
-- raw_reference, or metadata columns at all.
--
-- This table is the missing layer above the existing contribution
-- ledger, NOT a replacement for it:
--
--   payment_transactions  (this table — the payment rail's own record
--                           of what a provider told us, in payment-
--                           lifecycle terms)
--         |
--         v  (contribution_id / bank_transaction_id, set once Phase 4/5
--             wiring creates the ledger row from a SUCCESSFUL payment)
--   telecom_contributions / bank_transactions   (existing, UNCHANGED —
--                                                 the contribution ledger)
--         |
--         v  (wallet_transactions, existing, UNCHANGED)
--   insurance_allocations  (existing, UNCHANGED)
--
-- No existing table is altered, renamed, or dropped. This migration
-- only adds the new table plus the two composite-uniqueness indexes
-- explained below. Not yet referenced by any application code — no
-- webhook/service wiring happens until PHASE 4/5.
--
-- Deliberate scope note: PHASE 2's status list is 7 values (INITIATED,
-- PENDING, SUCCESSFUL, FAILED, REVERSED, REFUNDED, DISPUTED). PHASE 3
-- (member identification, implemented in a later step) explicitly
-- requires an 8th: PENDING_REVIEW, for a payment that cannot
-- confidently identify a member and must not auto-credit. It is
-- included in the CHECK constraint now so PHASE 3 does not need a
-- second migration just to widen this enum — a schema decision, no
-- PHASE 3 business logic is implemented yet.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS payment_transactions (
    payment_transaction_id SERIAL PRIMARY KEY,

    -- The provider's own identifier for this transaction. Unique PER
    -- PROVIDER (see the two partial unique indexes below), not
    -- globally — fixing a real gap found in PHASE 1: telecom_contributions
    -- .reference_number and bank_transactions.transaction_reference are
    -- both globally UNIQUE today, which would incorrectly reject a
    -- second provider's legitimate transaction if it happened to reuse
    -- an ID another provider already used.
    external_transaction_id VARCHAR(150) NOT NULL,

    -- TUJITUNZE's own reference, independent of the provider's ID —
    -- same purpose and generation pattern as
    -- Telecom/BankService.generateInternalReference() already
    -- established, reused here rather than reinvented.
    internal_reference VARCHAR(100) NOT NULL,

    -- NULL when the payment cannot yet be confidently matched to a
    -- member (status = 'PENDING_REVIEW', PHASE 3) — filled in once
    -- matched or manually reconciled. Never trust a name alone (see
    -- PHASE 3): identification is via phone_id / member_bank_account_id
    -- below, member_id is the resolved result of that lookup.
    member_id INT REFERENCES users(user_id),

    channel VARCHAR(20) NOT NULL
        CHECK (channel IN ('TELECOM_AIRTIME', 'BANK_TRANSFER')),

    -- Mutually-exclusive-by-channel provider links, mirroring the exact
    -- pattern wallet_transactions already uses for
    -- contribution_id/bank_transaction_id — never a single polymorphic
    -- "provider_id + provider_type" pair, to stay consistent with this
    -- codebase's established shape.
    telecom_operator_id INT REFERENCES telecom_operators(operator_id),
    bank_id INT REFERENCES banks(bank_id),

    -- The specific identification evidence PHASE 3 must validate against
    -- (phone number for Telecom, bank account for Bank) — not just an
    -- opaque member_id, so a reviewer can see exactly what evidence was
    -- used to (attempt to) resolve the member.
    phone_id INT REFERENCES phone_numbers(phone_id),
    member_bank_account_id INT REFERENCES member_bank_accounts(member_bank_account_id),

    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'TZS',

    -- e.g. 'Airtime' / 'Mobile Money Transfer' / 'Bank Transfer' — reuses
    -- contribution_rules.rule_type's existing vocabulary, not a new one.
    transaction_type VARCHAR(50) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'INITIATED'
        CHECK (status IN (
            'INITIATED', 'PENDING', 'SUCCESSFUL', 'FAILED',
            'REVERSED', 'REFUNDED', 'DISPUTED', 'PENDING_REVIEW'
        )),

    -- When the provider claims the transaction occurred (from their
    -- payload) — distinct from received_at (when TUJITUNZE's webhook
    -- got it) and processed_at (when TUJITUNZE finished acting on it).
    -- Neither distinction exists on telecom_contributions/
    -- bank_transactions today (PHASE 1 finding).
    provider_timestamp TIMESTAMP,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    failure_reason TEXT,

    -- Points at the OTHER payment_transactions.internal_reference this
    -- row relates to: set on a REVERSED/REFUNDED row to name what it
    -- reverses, and (once PHASE 9 exists) settable on the original row
    -- too, so the relationship is discoverable from either side.
    reversal_reference VARCHAR(100),

    -- The raw, unparsed reference/payload the provider sent — kept
    -- verbatim for forensic/dispute purposes, separate from the parsed
    -- external_transaction_id above.
    raw_reference TEXT,

    -- Provider-specific extra fields that don't warrant their own
    -- column (sender name, narration, channel-specific codes, etc.).
    metadata JSONB,

    -- Set once PHASE 4/5 wiring creates the corresponding contribution
    -- ledger row from a SUCCESSFUL payment — the literal
    -- "payment_transaction -> contribution ledger" link the target
    -- architecture requires. Mutually exclusive by channel, same
    -- pattern as telecom_operator_id/bank_id above.
    contribution_id INT REFERENCES telecom_contributions(contribution_id),
    bank_transaction_id INT REFERENCES bank_transactions(bank_transaction_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- No DB trigger — this schema has none anywhere (checked: zero
    -- triggers exist today); every other updated_at column in this
    -- project is maintained by explicit `SET updated_at = NOW()` in
    -- application code, and this column follows that same convention.
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payment_transactions_channel_provider_check CHECK (
        (channel = 'TELECOM_AIRTIME' AND telecom_operator_id IS NOT NULL AND bank_id IS NULL)
        OR
        (channel = 'BANK_TRANSFER' AND bank_id IS NOT NULL AND telecom_operator_id IS NULL)
    )
);

-- Per-provider external-ID uniqueness (partial indexes, since
-- telecom_operator_id/bank_id are mutually exclusive and NULL on the
-- "wrong" side) — this is the actual fix for the global-uniqueness gap
-- found in PHASE 1.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_telecom_external_unique
    ON payment_transactions(telecom_operator_id, external_transaction_id)
    WHERE channel = 'TELECOM_AIRTIME';

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_bank_external_unique
    ON payment_transactions(bank_id, external_transaction_id)
    WHERE channel = 'BANK_TRANSFER';

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_internal_reference_unique
    ON payment_transactions(internal_reference);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_member ON payment_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_channel ON payment_transactions(channel);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_received_at ON payment_transactions(received_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_contribution ON payment_transactions(contribution_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bank_transaction ON payment_transactions(bank_transaction_id);

COMMIT;
