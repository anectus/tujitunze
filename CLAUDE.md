# Tujitunze / HSIMS — Project Instructions

Health Savings and Insurance Management System for Tanzania. Handles national ID
(NIDA) numbers, health records, and financial transactions (wallet, bank,
telecom contributions) — treat all member data as sensitive by default.

Stack: Next.js (App Router) frontend, NestJS + TypeORM + PostgreSQL backend.

## Roles

**Hospital role removed (2026-08-26, previously undocumented here — see
migration `database/migrations/0008_remove_hospital_role.sql`).** Tujitunze
no longer pays hospitals directly; Insurance replaces Hospital as the
settlement counterparty in the Member → Telecom/Bank → Insurance →
Super-admin flow. There is no `Hospital` role, no `backend/src/modules/
hospital/`, and no `frontend/app/(hospital)/` route group — confirmed
absent from this checkout. The live `roles` table holds exactly six rows:
`Member`, `Admin`, `Bank`, `Telecom`, `Insurance`, `Super-admin`.
`users.hospital_id` is dropped; `settlements.counterparty_type` only
accepts `Telecom`/`Insurance` now (see the Bank section below). The
`hospitals`, `healthcare_claims`, and `healthcare_verifications` tables
are deliberately **kept** as frozen historical/reference data — every
existing claim/verification row still shows the hospital name it points
at (joined read-only in `members.service.ts`/`insurance.service.ts`),
there's just no more write path since the Hospital role that used to
author those rows is gone. Every "Hospital" mention in the dated
paragraphs and the route-group table below predates this change and
describes a role that no longer exists — treat those as historical
record, not current state.

Source of truth: the `roles` table seed data in `database/schema/tujitunze.sql`
and the route groups under `frontend/app/(*)`. Backend enforcement is
`@Roles('RoleName')` + `RolesGuard` (`backend/src/modules/auth/guards/roles.guard.ts`)
on top of `JwtAuthGuard` — a request must pass both to reach a role-scoped
handler. As of 2026-08-14, **every role has at least one real, guarded
backend endpoint**: `Member` (`members.controller.ts`), `Admin`
(`backend/src/modules/admin/` — members and hospital-directory management,
plus `GET /admin/dashboard`), and now `Hospital`/`Bank`/`Telecom`/
`Insurance`/`Super-admin`, each with its own module
(`backend/src/modules/{hospital,bank,telecom,insurance,super-admin}/`)
exposing a single `GET /<role>/dashboard` summary endpoint following the
same `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` pattern `admin`
established. Beyond that one endpoint per role, these five are still a
thin slice — no CRUD for patients/claims/billing/accounts/etc. yet; add
those to the same module as the need comes up, not as new modules per
resource.

Hospital/Bank/Telecom/Insurance dashboards are tenant-scoped: `users` has
nullable `hospital_id`/`bank_id`/`telecom_operator_id`/
`insurance_provider_id` columns (`database/migrations/
0004_add_staff_tenant_links.sql`) linking a staff account to the specific
hospital/bank/operator/provider it belongs to, and each service throws
`ForbiddenException` if that link is unset rather than returning
empty/global data.

As of 2026-08-14, Super-admin can now create staff accounts for any role
through a real endpoint instead of hand-written SQL: `POST /super-admin/
administrators` (`backend/src/modules/super-admin/super-admin.service.ts`
`createAdministrator`, DTO in `dto/create-administrator.dto.ts`) validates
NIDA/email uniqueness the same way `members.service.ts`'s `register()`
does, hashes the password at the same bcrypt cost (12 rounds), rejects a
tenant id that doesn't match what the chosen role requires (Hospital/Bank/
Telecom/Insurance need one, Admin/Super-admin must not have one), and
audit-logs the creation (`staff_account.create`) inside the same
transaction as the write. `GET /super-admin/administrators` lists every
non-Member account with its role and tenant name; `GET /super-admin/
tenants` feeds the create form's tenant dropdown. Frontend at
`(super-admin)/super-admin/administrators/page.tsx`. `Member` accounts
still only ever come from `/members/register` — this endpoint deliberately
excludes that role. Covered by
`backend/test/super-admin-administrators.e2e-spec.ts`, including the full
create → log in → reach the new account's own scoped dashboard loop.

As of 2026-08-15, Super-admin can also manage the roles/permissions catalog
itself, closing the gap the table below used to call out: `GET
/super-admin/roles` lists every role with its permissions and live
`user_count`; `POST /super-admin/roles` creates a role (starts with no
permissions); `PUT /super-admin/roles/:id/permissions` replaces a role's
permission set wholesale (not incremental — send the full desired list);
`PATCH /super-admin/roles/:id` renames/redescribes a role; `DELETE
/super-admin/roles/:id` removes one. `GET /super-admin/permissions` lists
the permission catalog for the assignment UI. All five live in
`super-admin-roles.service.ts`/`super-admin-roles.controller.ts` and share
the same `JwtAuthGuard` + `RolesGuard` + `@Roles('Super-admin')` guard as
`administrators`. Rename/delete both reject the seven seeded role names
(`Member`/`Admin`/`Hospital`/`Bank`/`Telecom`/`Insurance`/`Super-admin` —
see `CORE_ROLE_NAMES` in the service) with `403`, since those strings are
load-bearing in every `@Roles(...)` decorator and frontend route group;
delete additionally rejects with `409` if the role still has any
`member_roles` rows (reassign first). Every write is audit-logged
(`role.create`/`role.update`/`role.permissions_update`/`role.delete`)
inside the same transaction. Frontend at
`(super-admin)/super-admin/roles/page.tsx` — core roles render read-only
(name/description as text, no delete button); custom roles get editable
fields and a delete button, purely a UX mirror of the backend's guard, not
a substitute for it. Covered by
`backend/test/super-admin-roles.e2e-spec.ts`.

As of 2026-08-17, the Member dashboard is a real 9-section hub instead of
three quick links: My Profile, My Membership, Contribution, Health Fund
Status, Healthcare Services, Hospital Verification, Claims, Notifications,
and Transaction History (`(member)/dashboard/page.tsx`). All of it reads
from tables `tujitunze.sql` already defined but that had no NestJS module
behind them yet: `GET /members/membership` combines `users` +
`health_wallets` + `member_insurance`/`insurance_plans` into one summary
(member ID is computed as `TB` + zero-padded user id, not a stored
column); `GET/PATCH /members/notifications*` is a new
`NotificationsModule` (`backend/src/modules/notifications/`) that other
modules write into transactionally — a wallet top-up, first-time
onboarding completion, a new phone/bank link, a password change, and
setting a primary phone (new: `PATCH /members/phone-numbers/:id/primary`)
each create a real notification row, the same atomic-with-the-write
pattern `AuditLogsService` established; `GET /members/hospitals` +
`GET /members/hospitals/:id` is a read-only member-facing view of the
same `hospitals` table Admin manages; `GET /members/insurance` and
`GET /members/claims` read the member's own `member_insurance` and
`healthcare_claims` rows. `GET /members/verifications` and the Claims
list are genuinely real endpoints but will read back empty on a fresh
DB — nothing writes to `healthcare_verifications` or creates a claim yet
(that's a Hospital-side check-in/claim-filing flow that doesn't exist),
same honest gap as `telecom_contributions` below. `wallet/transactions`
and `insurance/claims`/`insurance/plans` (previously hand-written sample
data with an on-page disclaimer) now fetch these real endpoints instead.
Member-facing `hospitals`, `hospitals/[id]`, `notifications`, and
`membership` frontend pages replace what were `ComingSoonPage`
placeholders; `hospitals/appointments`, `wallet/withdraw`,
`wallet/transfer`, and everything under `telecom/*` are still
placeholders — no backend exists for appointments, withdrawals/transfers,
or telecom purchases (that last one is the unbuilt micro-levy engine).

As of 2026-08-17, the Telecom staff dashboard grew from one summary
endpoint into a real multi-page module (`backend/src/modules/telecom/`),
backed by migration `database/migrations/0005_telecom_dashboard.sql`
(new columns on `telecom_operators` for contact info + API/webhook
credentials, plus `contribution_rules` — seeded with the documented
default levy rates — `telecom_reconciliation_runs`/`_records`, and
`api_access_logs`). All of it is tenant-scoped the same way the original
`GET /telecom/dashboard` was, via `users.telecom_operator_id`. Real:
`GET /telecom/operator` (info, contact, credential status — never
returns the key/secret itself), `PATCH /telecom/operator/contact`,
`POST /telecom/operator/api-key/regenerate` (bcrypt-hashed at rest, full
key shown exactly once), `POST /telecom/operator/webhook` (secret stored
retrievable-plaintext, not hashed — HSIMS would need the raw value to
sign outgoing deliveries with it; flagged below as a known gap, not a
pattern to copy), `POST /telecom/operator/connection-test` (a real
outbound HTTP call to the operator's `api_endpoint`, logged to
`api_access_logs`), `GET /telecom/members` (roster scoped by phone
number's operator), `GET /telecom/contributions` (+ `/export` CSV,
status-filterable — also backs the Successful/Failed Transactions
views), `GET /telecom/contribution-rules` (read-only for Telecom —
editing is a deliberately deferred Admin/Super-admin decision),
`POST /telecom/reconciliation/runs` (upload the operator's own record
batch, matched against `telecom_contributions` by reference+amount) +
`GET /telecom/reconciliation/runs[/:id]`, `GET /telecom/reports`
(daily/weekly/monthly contribution aggregation), and
`GET /telecom/activity-logs` / `GET /telecom/api-access-logs`. Still
placeholder: an inbound webhook-receipt endpoint that would actually
*use* the API key (credential issuance is built, nothing consumes it
yet — deliberately not built alongside this pass, since that endpoint
would create real `telecom_contributions`/wallet-affecting writes and
deserves its own threat-modeling pass, not a side effect of a dashboard
task); authentication/login-attempt logging (the `sessions` table exists
in schema but nothing writes to it, system-wide, not just for Telecom);
and a rolled-up multi-run reconciliation trend report (today's
Reconciliation Report just links to the run-by-run history page).
Frontend at `(telecom)/telecom/{operator,members,contributions,
contribution-rules,reconciliation,reports,audit-logs}` — all
`/telecom/...`-prefixed from the start, unlike the Member-dashboard pass
which hit the bare-path collision live (see above); this one avoided it

**Note:** the paragraph above predates work landed after 2026-08-17 —
`POST /telecom/webhooks/contribution` (a real inbound webhook boundary,
`TelecomWebhooksController`, separately guarded by `TelecomApiKeyGuard`
+ `TelecomWebhookSignatureGuard` rather than the staff `JwtAuthGuard`),
`payment_transactions` (migration `0018`), and a Vodacom M-Pesa C2B
collection rail (`backend/src/modules/telecom/vodacom/`, migrations
`0021`-`0023`) all exist now but aren't described here yet. Treat this
section as directional, not current — check the actual controllers/
migrations before relying on it for anything security-relevant.

As of 2026-09-02, a usage-quantity-based telecom contribution feature
(migrations `0019`-`0020`, internally called "Model B": a % of
*consumed* VOICE/SMS/DATA quantity, converted to TZS only via a
provider-authorized valuation, then credited to the wallet) was built,
then **removed** (migration `0024`,
`database/migrations/0024_remove_telecom_usage_model_b.sql`) once a
fuller product spec clarified that Principle 1 of the intended
micro-saving system is a *bundle/resource-conversion* event (airtime
converted into voice/data/SMS), not a usage-consumption event — a
different trigger from what Model B implemented. Removed: the
`telecom_usage_events` table and its 3 seeded `contribution_rules` rows
(`VOICE`/`SMS`/`DATA`, `channel='TELECOM'`), `POST
/telecom/webhooks/usage`, `TelecomService.handleUsageEventWebhook` /
`listUsageEvents` / `getUsageEvent` / `getUsageEventsSummary`, `GET
/telecom/usage-events*`, `telecom-usage-event.types.ts`,
`webhook-usage-event.dto.ts`, and the `(telecom)/telecom/
usage-contributions` frontend page. Migration `0024` is a forward
(compensating) migration, not an edit to `0019`/`0020` — those already
ran against this project's shared dev database (see
`database/docker-initdb.sh`: migrations only replay against a *fresh*
Postgres volume), so rewriting their history would silently diverge
from what's actually running; `0024`'s `DROP TABLE`/`DELETE` was also
applied directly to the live dev container. `contribution_rules`'
generic columns from `0019` (`channel`, `usage_type`, `rate`,
`currency`, `effective_to`) were deliberately kept — reusable
infrastructure, not part of the mistake — for whatever rule shape the
replacement design settles on. The Vodacom M-Pesa C2B rail (previous
paragraph) is unrelated to this removal: it's a money-*in* wallet
top-up/collection mechanism, not a bundle-conversion or
outgoing-transaction-diversion one, and was left untouched.

The replacement — the dual-mode micro-savings engine — landed the same
day (migration `0025_dual_mode_micro_savings.sql`), backend-complete
and unit-tested, frontend not yet started. **Principle 1 (resource
conversion)**: `POST /telecom/webhooks/resource-conversion`
(`TelecomWebhooksController`, same `TelecomApiKeyGuard` +
`TelecomWebhookSignatureGuard` chain as `.../contribution`) is
synchronous — the operator must receive `netUnitsToCustomer` back
before granting anything, which is what keeps the saving invisible to
the member (100 min requested, 10% rule → 90 min granted, 50 TZS to
the wallet, computed in `TelecomService.handleResourceConversionWebhook`,
`telecom-resource-conversion.types.ts`). Staff reads: `GET
/telecom/resource-conversions[/:id]`, `GET
/telecom/resource-conversions/summary`. **Principle 2 (transaction
diversion)**: `POST /telecom/webhooks/outgoing-transaction` is
fire-and-forget, called only *after* a Tuma/Lipa Namba/Toa/Bill
Payment has already settled (`handleOutgoingTransactionWebhook`,
`outgoing-transaction-diversion.types.ts`); THIS PASS ONLY WIRES
TELECOM-OPERATOR-AUTHENTICATED INTAKE (`provider_type='TELECOM'`) —
mobile money in Tanzania is telecom-operated, so this covers the
dominant real case, but bank- and Selcom-switch-authenticated intake
are deferred pending their own credential-issuance design (no
`banks`-equivalent API-key guard was generalized here, and no
Selcom credential/entity exists anywhere in this codebase). Its 4
seeded rules (`TUMA` 1%, `LIPA_NAMBA` 1.5%, `TOA` 1%, `BILL_PAYMENT`
2%) start `is_active = FALSE` **on purpose** — `funding_source =
'INTERCHANGE_SHARE'` assumes a revenue-share agreement with the
relevant switch/operator that does not exist yet; the webhook handles
an inactive/missing rule by acknowledging and crediting nothing
(`status: 'SKIPPED'`), never by erroring, since the underlying payment
already settled either way. **Shared**: both principles write into
the same `telecom_contributions` → `WalletsService.creditContribution`
→ `wallet_transactions` chain every other contribution path already
uses, plus a new `saving_ledger` table (one append-only row per saving
event, whichever principle produced it — the single audit trail `GET
/members/savings-summary` reads from). `contribution_rules` gained
`principle`/`transaction_type` columns (same "extend, don't duplicate"
precedent `0019` set); its previously-flagged read-only gap is now
closed specifically for these rule families via `GET`/`POST`/`PATCH
/super-admin/saving-rules` (`SuperAdminSavingRulesService` — the four
pre-existing purchase-based rows are still out of scope/read-only).
Not yet built: any frontend for resource-conversions/outgoing-
diversions/saving-rules/savings-summary, bank/switch intake for
Principle 2, and the commercial interchange-share agreement itself
(a business dependency, not an engineering one).
by not reusing the old bare `customers`/`transactions`/`payments`/
`reconciliation`/`reports`/`settings` stub folders.

**Update, same day (2026-09-02):** a code-verified audit of the
dual-mode engine against the intended design flagged several gaps,
all now closed by migrations `0026`/`0027` plus the corresponding
service/frontend changes — the "frontend not yet started" line above
is now stale: `(member)/savings`, `(super-admin)/super-admin/
saving-rules`, `(telecom)/telecom/resource-conversions`, and
`(telecom)/telecom/outgoing-diversions` all exist and are wired to
real endpoints (the Member dashboard's "Micro-Savings" tile already
linked to `/savings` — the audit's claim that this page was an
orphan was itself wrong). What actually changed:

- **Silent data loss, fixed.** Both webhook handlers used to respond
  to the operator without persisting anything whenever there was
  nothing to save (`handleOutgoingTransactionWebhook` on an
  inactive/missing rule, `handleResourceConversionWebhook` on no
  matching rule) — meaning every real Tuma/Lipa/Toa/BillPayment call
  was silently dropped with zero audit trail, since all 4 Principle 2
  rules seed inactive. Migration `0026` widens both tables' `status`
  CHECK constraints (`telecom_resource_conversions` gains
  `NO_ACTIVE_RULE`/`OPTED_OUT`; `outgoing_transaction_diversions`
  gains `SKIPPED`/`OPTED_OUT` — both tables were later split by
  migration `0028`, see below; the constraints carried over to their
  respective new usage/savings tables unchanged), and both handlers
  now always write a
  row — full gross amount passed through, nothing withheld — before
  returning. The operator-facing contract is unchanged (still a `400`
  when no rule matches, still an acknowledging `200` when a rule is
  simply inactive); only persistence was added.
- **Consent, added.** `member_saving_consents` (migration `0026`,
  one row per member; absence of a row means consented — every
  existing and new member starts opted in, so this is additive, not a
  behavior change on day one) backs `GET`/`PATCH
  /members/saving-consent` (`MembersService.getSavingConsent` /
  `updateSavingConsent`, audit-logged as `member.saving_consent_update`)
  and a toggle on `(member)/settings`. Both webhook handlers check it
  after matching a phone to a member and, if opted out, persist a row
  with `status = 'OPTED_OUT'` and pass the full gross amount/units
  through uncredited, rather than silently applying the rule.
- **Webhook secrets, encrypted at rest.** `telecom_operators.
  webhook_secret` / `banks.webhook_secret` (previously the plaintext
  gap Known Security Gap #12 described) are now AES-256-GCM encrypted
  by `backend/src/common/webhook-secret-crypto.ts`, keyed by a new
  required env var `WEBHOOK_SECRET_ENCRYPTION_KEY` (64-hex-char/32-byte,
  fails closed if unset — no insecure fallback, same rule
  `DB_PASSWORD` already sets). `TelecomService.configureWebhook` /
  `BankService.configureWebhook` encrypt on write; the still-plaintext
  value is returned to staff once, same as before. `TelecomWebhook
  SignatureGuard` / `BankWebhookSignatureGuard` — which read this
  column on every inbound webhook call to verify the HMAC signature —
  now decrypt it first. See Known Security Gaps below: #12 is now
  resolved.
- **Seeded rates corrected** (migration `0027`, data-only — these
  rows were already runtime-editable via `/super-admin/saving-rules`,
  so this just fixes the defaults a fresh environment seeds): `DATA`
  10% (was 8%), `LIPA_NAMBA` 1% (was 1.5%), `BILL_PAYMENT` 1% (was
  2%). `VOICE`/`SMS`/`TUMA`/`TOA` were already correct.
- **Normalization layer, added.** `BaseWebhookEventDto`
  (`backend/src/modules/telecom/dto/base-webhook-event.dto.ts`) factors
  out the fields all three webhook DTOs shared with subtly different
  validators (`operatorId`, `phoneNumber`, `externalTransactionId`);
  `WebhookContributionDto`/`WebhookResourceConversionDto`/
  `WebhookOutgoingTransactionDto` now extend it. Pure refactor, no
  wire-format change.
- **`INCOMING` transaction type — schema-only placeholder.**
  `telecom_outgoing_transaction_events.transaction_type` (see the
  ledger-split entry immediately below) and `contribution_rules` both
  accept `'INCOMING'` (migration `0027`, one seeded rule at 0%,
  `is_active = FALSE`), matching the design's "incoming transactions:
  0%" line. Deliberately incomplete: there is no webhook route,
  controller handler, or DTO for actually receiving an
  incoming-transaction event, because no operator specification for
  what that event looks like exists — this is a labeled empty slot,
  not a working feature.
- **Update, 2026-09-02 (later same day): the literal three-ledger
  split, done.** The paragraph that used to be here explained why a
  physical split was skipped as unnecessary schema churn; the user
  asked for the literal split anyway, so migration `0028_split_
  savings_transaction_usage_ledgers.sql` did it. `telecom_
  resource_conversions` → `telecom_resource_conversion_events`
  (Transaction Ledger: the raw inbound event only — operator, phone,
  resource type, gross units, timestamp) + `telecom_resource_usage_
  splits` (Usage Ledger: saving_rate/saved_units/net_units_to_customer/
  provider_unit_value_tzs/saved_value_tzs/status/contribution_id, one
  row per event via a `UNIQUE` `event_id` FK with `ON DELETE CASCADE`).
  `outgoing_transaction_diversions` → `telecom_outgoing_transaction_
  events` (Transaction Ledger) + `outgoing_transaction_savings` (Usage
  Ledger: saving_rate/saved_amount_tzs/funding_source/status/
  contribution_id), same 1:1 shape, for symmetry with Principle 1 —
  there's no bundle being split on the Principle 2 side, only a
  transaction amount being assessed against a rule, but keeping the
  same two-table shape means both principles model the same three
  ledger concerns identically rather than one being an exception.
  `saving_ledger` (the cross-cutting Saving Ledger) is unchanged;
  only its `source_table` values were repointed at the new event
  tables (`source_id` values were unaffected — the migration inserts
  each new event row with the *same* id the old merged row had, so
  nothing needed remapping). `TelecomService` now reads both tables
  via two small JOIN-based helpers per principle (`selectResource
  ConversionByEventId`/`ByIdempotencyKey`,
  `selectOutgoingDiversionByEventId`/`ByIdempotencyKey`) that
  reconstruct the exact same flat row shape the pre-split code
  returned — every consumer (`TelecomResourceConversionRow`/
  `OutgoingTransactionDiversionRow`, their mappers, both frontend pages
  at `/telecom/resource-conversions` and `/telecom/outgoing-diversions`,
  `GET /members/savings-summary`) needed zero changes as a result. Both
  webhook handlers now write the event row and its split/savings row
  inside the same DB transaction they already used (the no-rule/
  opted-out/skipped branches, previously plain un-transacted inserts,
  are now transacted too, since two inserts must commit atomically —
  see the updated unit specs, which now assert `dataSource.transaction`
  **was** called for those branches, the opposite of what they asserted
  before this split).
- **Still not built, unchanged from before:** Selcom/bank-authenticated
  intake for Principle 2 (no real API docs or credentials exist for
  this anywhere — building it would be guesswork, not integration),
  and the commercial interchange-share agreement that would flip
  Principle 2's 4 rules active (a business dependency, not an
  engineering one).
- **New e2e coverage:** `backend/test/telecom-dual-mode-savings.
  e2e-spec.ts` proves the full webhook → wallet → `saving_ledger` chain
  for both principles' happy paths plus the `OPTED_OUT`/`SKIPPED`
  persistence fixes, against a real running app (the existing unit
  specs `telecom-resource-conversion.spec.ts` / `outgoing-transaction-
  diversion.spec.ts` were updated for the new call order — phone
  lookup moved out of the transaction block so the no-rule/opted-out
  branches can use it too — and cover the same branches at the mock
  level). Writing this test surfaced a pre-existing gap, noted below
  as Known Security Gap #13: several `backend/test/*.e2e-spec.ts`
  files pick "the first non-Vodacom telecom operator" / "the first
  bank" as a shared fixture and mutate its `api_key_hash`/
  `webhook_secret` — under Jest's default parallel-worker execution,
  two spec files claiming the same row race and can 401 each other
  intermittently. Confirmed pre-existing (reproduces with the new spec
  file entirely absent) and confirmed not a real application bug
  (`--runInBand` passes every time); the new spec avoids contributing
  to it by claiming the *last* non-Vodacom operator instead of the
  first, but the underlying fixture-sharing pattern across the older
  spec files was not otherwise touched.

As of 2026-08-17, the Bank staff dashboard grew the same way, via
`backend/src/modules/bank/` and migration `database/migrations/
0006_bank_dashboard.sql`. It mirrors Telecom's shared pieces exactly
(contact info, API/webhook credentials — both encrypted at rest since
2026-09-02, see the resolved Known Security Gap #12 — connection
testing, reconciliation, reports, audit logs) but also introduces
genuinely new territory the Telecom pass didn't need: HSIMS's own
operational accounts at the bank. `bank_fund_accounts` holds one ledger
row per (bank, account type) — Settlement / Health Fund / Reserve,
lazily created the same way `health_wallets` is — with `balance` and
`reserved_balance` columns; `bank_fund_transfers` is the append-only
ledger of deposits/withdrawals against them. `settlements` records a
payout to a Telecom or Insurance partner (Hospital was a valid
counterparty at the time this paragraph was written; migration `0008`
replaced it with Insurance — see the Roles section above): creating one reserves the
amount from the Settlement account's `reserved_balance` (status
`Pending`), and `PATCH /bank/settlements/:id/complete` is what actually
debits `balance` and writes the `Settlement Out` transfer row (status
`Completed`) — verified end-to-end against a real running instance,
including that over-committing past the available balance correctly
`400`s. Like `health_wallets`, this is ledger/bookkeeping only, not a
live payment rail — see Known Security Gap #8. `bank_transactions`
(Deposits/Withdrawals/Transactions) still has no writer — no Member-side
"request a bank withdrawal" flow exists — so `PATCH /bank/transactions/
:id/status` (the withdrawal-approval action) is real and tenant-checked
but has nothing to act on yet, same honest shape as Telecom's contribution
transactions. Bank's reconciliation does a three-way match (`Matched` /
`Discrepancy` — reference matches but amount doesn't / `Unmatched`)
rather than Telecom's binary one, since the dashboard spec calls out
Discrepancies as their own concept. One tenant-isolation bug was caught
and fixed before shipping: `listActivityLogs`'s first draft filtered
`audit_logs` by `affected_record_id` for `settlements`/`bank_transactions`
rows without checking those records actually belonged to *this* bank
(that id isn't a bank id) — fixed to match Telecom's narrower, safe
shape (own profile changes + this staff member's own actions only).

Each role's frontend route group (`app/(admin)`, `(bank)`,
`(telecom)`, `(super-admin)`, `(insurance)`, `(member)`) does have a
client-side gate now: `components/auth/ProtectedRoute.tsx` (using
`lib/hooks/useAuth.ts` / `lib/utils/permissions.ts`) wraps each
`layout.tsx`, decodes the JWT out of `localStorage`, and redirects to
`/login` (no/expired token) or `/access-denied` (wrong role). **This is
UX/defense-in-depth only, not a security boundary** — the token is decoded
client-side, not verified, so it's trivially bypassable by editing
`localStorage`. The backend guard above is what actually protects the
data, same as the existing rule that the frontend not showing a button is
never sufficient on its own.

Every staff route group now also shares one sidebar shell
(`components/dashboard/DashboardLayout.tsx` + `components/common/
Sidebar.tsx`, mounted in each group's `layout.tsx`) so a role's nav is
consistent across every page in that group, not just its dashboard. A
group's `NAV_ITEMS` list only real pages — most of these route groups
still have no `page.tsx` beyond `dashboard/`, so don't copy a nav entry
from this table's route-group column without first checking the page
exists, or it'll 404.

Route groups don't add a URL prefix in Next.js — `(admin)/dashboard` and
`(member)/dashboard` would both resolve to `/dashboard` and collide, which
is why each role's dashboard lives at `/<role>/dashboard`
(`app/(admin)/admin/dashboard`, `app/(bank)/bank/dashboard`, …)
except `Member`, which already owned the bare `/dashboard`. The other
folders each route group was originally scaffolded with (e.g. `(admin)/
claims`, `(admin)/settings`) are still bare, unprefixed segments — the
same collision is latent there too (two role groups both adding, say, a
`reports/page.tsx` will collide at `/reports`) and will need the same
`/<role>/...` prefix treatment whenever those get built out, not just
`dashboard`.

| Role | Who | Route group | What they're for |
|---|---|---|---|
| `Member` | A registered citizen/patient | `(member)` — dashboard, wallet, telecom, insurance, reports, profile, notifications, settings, qr, onboarding | Their own health savings/wallet, linking phone/bank accounts, viewing their own claims and insurance, nothing belonging to another member |
| `Admin` | Internal Tujitunze staff | `(admin)` — members, users, claims, transactions, banks, telecom, reports, audit-logs, settings; dashboard at `/admin/dashboard` | Operational oversight across members: user/claim/transaction management, reviewing audit logs — not the same as `Super-admin` (system-level config) |
| `Insurance` | Staff at an insurance provider | `(insurance)` — dashboard at `/insurance/dashboard` (only page; route group didn't exist before 2026-08-14) | Managing their own plans and reviewing claims routed to them |
| `Bank` | Staff at a partner bank / bank integration | `(bank)` — real pages now at `/bank/dashboard`, `/bank/profile`, `/bank/fund-accounts`, `/bank/transactions`, `/bank/settlements`, `/bank/reconciliation[/:id]`, `/bank/reports`, `/bank/audit-logs` (all `/bank/...`-prefixed; the old bare `accounts`/`customers`/`transactions`/`transfers`/`reconciliation`/`reports`/`settings` folders are untouched empty stubs, not reused) | Their own bank's linked accounts/transactions, plus HSIMS's own operational fund accounts and settlements at this bank — same cross-tenant boundary concern as Telecom/Insurance below |
| `Telecom` | Staff at a partner telecom operator | `(telecom)` — real pages now at `/telecom/dashboard`, `/telecom/operator`, `/telecom/members`, `/telecom/contributions`, `/telecom/contribution-rules`, `/telecom/reconciliation[/:id]`, `/telecom/reports`, `/telecom/audit-logs` (all `/telecom/...`-prefixed per the collision rule above — the old bare `customers`/`transactions`/`payments`/`reconciliation`/`reports`/`settings` folders are untouched empty stubs, not reused) | Their own operator's contribution/levy data, member roster, API credentials, and reconciliation only |
| `Super-admin` | Platform owner/operator | `(super-admin)` — dashboard at `/super-admin/dashboard`, staff provisioning at `/super-admin/administrators`, roles/permissions catalog at `/super-admin/roles`; integrations, system, audit-logs, settings folders still empty | System-wide configuration, managing other Admins, integrations — role is seeded (`role_id 7`); can create a staff account (any role) via `/super-admin/administrators` and manage the roles/permissions catalog via `/super-admin/roles` (create/rename/delete a role, assign its permissions) — the seven core role names can't be renamed or deleted |

## Forgot / reset password (email or phone)

`POST /auth/forgot-password` (`backend/src/modules/auth/`) takes a single
`identifier` field and detects email vs. Tanzanian phone itself — an
`@` routes to `issueEmailReset()`, everything else through
`normalizeTanzanianPhone()` (accepts `0712345678`/`255712345678`/
`+255712345678`) into `issuePhoneOtp()`. Both paths always return the
same generic message + a `channel` field, never revealing whether the
account exists. Email issues a 32-byte random token; phone issues a
random 6-digit OTP; both are stored only as a sha256 hash
(`password_reset_tokens.token_hash` / `password_reset_otps.otp_hash` —
migrations `0009`–`0012`), single-use, and expire (20 min / 10 min).
`POST /auth/verify-reset-otp` checks the OTP (max 5 attempts) and, on
success, issues a short-lived `resetToken` — a second, `channel:
'PHONE'` row in the same `password_reset_tokens` table — which
`POST /auth/reset-password` consumes the same way an emailed `token` is
consumed (`resetToken ?? token` in `ResetPasswordDto`). `POST
/auth/resend-reset-otp` reissues a phone OTP only (400s on an
email-shaped identifier). All four routes are `@Throttle`d, tested in
`backend/test/rate-limiting.e2e-spec.ts`.

Real email send is `nodemailer` against `MAIL_*`/`SMTP_*` env vars; real
SMS send is Africa's Talking against `SMS_*` (`SmsService`,
`backend/src/modules/auth/sms.service.ts`) — see `.env.example` for the
exact variable names. Neither is configured in a fresh local checkout,
and both fail closed with a `503` rather than pretending to have sent
anything (`ServiceUnavailableException`, "... is not configured"), so a
freshly-cloned dev environment cannot deliver a real reset email/SMS
until those vars are set — this is intended fail-closed behavior, not a
bug to route around.

Fixed 2026-08-25: `verifyResetOtp()` was throwing
`UnauthorizedException` from *inside* `dataSource.transaction()`'s
callback on a wrong OTP guess, which rolled back the whole transaction —
including the `attempts` increment it had just saved in the same
callback. That silently defeated the 5-attempt brute-force limit: a
wrong guess was correctly rejected in the moment, but never actually
persisted, so the OTP could be guessed indefinitely until it expired.
Fixed by having the transaction return a `{ok, resetToken?}` result and
throwing only after it commits, so a failed attempt's increment survives
regardless of the outcome. Covered by
`backend/test/password-reset.e2e-spec.ts` (seeds an OTP at
`attempts: maxAttempts - 1` and proves one more wrong guess locks it out
even for the subsequently-correct code) — if this regresses, that
specific test is the one that catches it.

## Secure Software Development Life Cycle (SSDLC)

Every change to this project — frontend or backend, big or small — goes
through these phases. Skipping a phase is a decision to flag to the user, not
a default.

### 1. Requirements & Planning
- State the security requirement alongside the functional one before building
  (e.g. "who is allowed to call this endpoint", not just "what does it do").
- Classify the data a feature touches: **PII** (name, NIDA, address, DOB),
  **financial** (wallet/bank/telecom transactions), **health** (claims,
  verifications, insurance), or **public**. PII/financial/health data always
  needs an authz check and an audit trail.

### 2. Design
- Threat-model new features before writing code: who can call this, what do
  they have access to today vs after this change, what's the worst input an
  attacker could send. A few sentences is enough for small features.
- Default to least privilege: a role (Member/Admin/Insurance/Bank/
  Telecom/Super-admin) gets only what its own workflows require — check
  `database/schema/tujitunze.sql` roles table and route groups under
  `frontend/app/(*)` for the current role boundaries.
- Secrets, keys, and tokens are never designed to live in source, only in env
  vars / a secrets manager.

### 3. Implementation
- Backend: use NestJS DTOs + `class-validator` + a global `ValidationPipe` for
  every endpoint that accepts input — do not rely on manual `if` checks alone
  (current `members.service.ts` / `auth.service.ts` predate this rule and are
  a known gap, not a pattern to copy).
- All DB access goes through TypeORM's query builder / repository API or
  parameterized raw queries (`$1`, `$2`, …) — never string-concatenated SQL.
- Every authenticated endpoint is guarded (NestJS Guards), never left to
  "the frontend won't show the button."
- Never commit `.env`; `.env.example` documents required keys with no real
  values.
- No hardcoded default credentials (e.g. `password: process.env.DB_PASSWORD
  || 'postgres'` in `database.config.ts` is a known gap — insecure fallback
  defaults should fail closed, not fall back to a guessable value).
- `TypeOrmModule` `synchronize: true` is dev-only. Production/shared
  environments must use migrations — flag before this ships anywhere beyond a
  local machine.

### 4. Verification
- Before treating a security-sensitive change as done, run it past the
  `security-review` skill (or `/code-review` for correctness/quality) rather
  than self-certifying.
- New auth/authz logic gets a test that proves the boundary holds (a
  non-member can't hit a member-only route, a bank can't see another
  bank's settlements, etc.), not just a happy-path test.
- Run `npm audit` (or equivalent) when dependencies change; don't add a
  package without checking it's maintained.

### 5. Deployment
- CORS allowlist stays explicit (see `backend/src/main.ts`) — never wildcard
  origins once real user data is involved.
- Security headers (e.g. `helmet`) are required before any non-local
  deployment — currently absent, tracked as a gap. Rate limiting on
  `/auth/login`, `/members/register`, and other write endpoints is now in
  place (`@nestjs/throttler`, see Known Security Gaps), but its in-memory
  storage needs revisiting before a horizontally-scaled deployment.
- HTTPS only outside local dev.

### 6. Maintenance
- `audit_logs` should capture writes to sensitive tables (claims, wallets,
  bank accounts, insurance policies) — check the table is actually being
  written to, not just present in the schema.
- Revisit this file's "known gaps" as they're closed, so it stays a live
  checklist instead of stale advice.

## Known Security Gaps (updated 2026-08-15)

Resolved since the original baseline: global `ValidationPipe`/DTOs are now
wired in `main.ts`; login issues a real JWT (`auth.service.ts`); guards
(`JwtAuthGuard`, `RolesGuard`) now protect role-scoped routes;
`backend/.env.example` lists required variables; `audit_logs` is now a
real entity/service (`backend/src/modules/audit-logs/`), written to
atomically inside the same DB transaction as the write it's logging
(`phone_number.add`, `bank_account.add`, `member.password_change`,
`member.status_change`), with an Admin-only `GET /admin/audit-logs` to
read it back; `Bank`/`Telecom`/`Insurance`/`Super-admin` now
each have a real guarded `GET /<role>/dashboard` endpoint instead of an
empty module stub; the `Super-admin` role row (previously believed
unseeded) was confirmed already present in the live database — no seed
migration was actually needed; Super-admin can now provision a staff
account for any role via `POST /super-admin/administrators` instead of a
hand-written SQL `INSERT`; Super-admin can now create/rename/delete
roles and edit their permission sets via `/super-admin/roles` instead of
hand-written SQL against `roles`/`role_permissions` (see the Roles section
above), with e2e coverage for the core-role-name protection; and
`@nestjs/throttler` (added 2026-08-15) now rate-limits `/auth/login`,
`/members/register`, `/members/phone-numbers`, `/super-admin/
administrators`, and `/super-admin/roles*` (`ThrottlerModule.forRoot` in
`app.module.ts` sets a generous global default, `@Throttle(...)` on each
of those handlers/controllers sets the tighter per-route limit), proven
by `backend/test/rate-limiting.e2e-spec.ts` actually hitting each limit
and asserting the `429`, not just checking the decorator is present.

Still open, flagged so they aren't silently reintroduced or forgotten:

1. `@nestjs/throttler`'s in-memory storage is per-process — fine for this
   single-instance app, but won't share rate-limit state across multiple
   backend instances behind a load balancer. Revisit with a shared store
   (e.g. Redis) before any horizontally-scaled deployment. Limits are also
   currently fixed in code, not configurable per-environment via env vars.
2. No `helmet`/security headers configured in `main.ts`.
3. `database.config.ts` falls back to a default DB password if
   `DB_PASSWORD` is unset.
4. `synchronize: true` in TypeORM config (fine for local dev, unsafe beyond
   it).
5. The frontend persists the JWT access token in `localStorage`
   (`components/auth/LoginForm.tsx`) — no `AuthProvider`/httpOnly-cookie
   infra exists yet (`providers/AuthProvider.tsx`, `lib/store/authStore.ts`
   are still empty stubs), so the token is exposed to XSS. Move to an
   httpOnly cookie once real session infra is built, before any non-local
   deployment.
6. `audit_logs` coverage is partial — only the four write paths listed
   above are instrumented. `POST /members/register` (account creation),
   `PATCH /members/me` (profile updates), and any future
   Bank/Telecom/Insurance writes are not yet logged. Extend each
   new sensitive write with `AuditLogsService.record(manager, …)` inside
   its transaction as those land, rather than adding it as an afterthought.
7. `AuditLogsService.list()` has no pagination or filtering — it returns
   the latest 200 rows flat. Fine for local testing; needs pagination
   (and probably filtering by member/action/date) before this is usable
   at real volume.
8. `POST /members/wallet/topup` (`backend/src/modules/wallets/`) credits
   the wallet ledger directly — it does **not** capture a real mobile
   money or bank debit. There is no live payment gateway integrated
   (`telecom-contributions`/`bank-transactions` modules are still empty
   stubs), so a top-up today is trusted, unauthenticated-by-a-third-party
   ledger math, not a real funds movement. Treat this as the wallet's
   internal accounting layer, not a payment feature, until a real
   mobile-money/bank integration sits in front of it. The same caveat now
   also applies to Bank's `bank_fund_accounts`/`bank_fund_transfers`/
   `settlements` (added 2026-08-17, migration 0006) — Bank staff record
   deposits/withdrawals/settlements as bookkeeping entries through
   `/bank/fund-accounts` and `/bank/settlements`; nothing actually moves
   money at a real bank.
9. `POST /super-admin/administrators` (added 2026-08-14) can *create* a
   staff account for any role and set its tenant link, but there's still
   no way to edit, deactivate, delete, or reassign one after creation —
   unlike roles (#10 below), administrators have no edit/delete path yet.
   A Bank/Telecom/Insurance login with no tenant link set still
   gets a `403 Forbidden` from its dashboard rather than someone else's
   data or a silent empty result — that part of the design hasn't changed,
   only how the link gets set in the first place.
10. `PUT /super-admin/roles/:id/permissions` replaces a role's entire
    permission set on every call rather than diffing — a stale client
    payload silently drops permissions another admin just added
    concurrently (last write wins, no optimistic-locking/version check).
    Deleting a role cascades its `role_permissions` rows at the DB level
    (`ON DELETE CASCADE`) but is blocked at the service layer whenever
    `member_roles` still references it, so no user is ever silently left
    with a dangling role.
11. None of the e2e spec files under `backend/test/` apply the global
    `ValidationPipe` that `main.ts` wires up for the real app — they only
    call `createNestApplication()` + `app.init()`, so class-validator
    never runs and a request with a missing/malformed body reaches the
    service layer unchecked instead of getting a `400`. This was only
    caught by accident while writing `rate-limiting.e2e-spec.ts` (an empty
    `POST /super-admin/roles` body 500'd in-process instead of the `400`
    the real running server correctly returns). That one spec now sets up
    its own `useGlobalPipes(...)` to match `main.ts`; the other four spec
    files still don't, so a DTO validation bug could pass their e2e suite
    while still being broken in production. Worth fixing once, in a
    shared test bootstrap helper, rather than copy-pasting the pipe setup
    into every spec file as it's noticed.
12. **RESOLVED 2026-09-02.** `telecom_operators.webhook_secret` (added
    2026-08-17, migration 0005) and `banks.webhook_secret` (added
    2026-08-17, migration 0006) were stored retrievable-plaintext.
    Now AES-256-GCM encrypted at rest via `backend/src/common/
    webhook-secret-crypto.ts`, keyed by `WEBHOOK_SECRET_ENCRYPTION_KEY`
    (fails closed if unset, no insecure fallback). `configureWebhook`
    on both `TelecomService`/`BankService` encrypts on write;
    `TelecomWebhookSignatureGuard`/`BankWebhookSignatureGuard` decrypt
    on the read path that verifies inbound HMAC signatures (this is
    the actual current use of the secret — it was never "sign outgoing
    deliveries with," see the dual-mode-savings 2026-09-02 update
    above for the corrected picture). No backfill migration was needed
    — both tables had zero rows with a secret set at the time of this
    fix.
13. Several `backend/test/*.e2e-spec.ts` files (`contribution-channels`,
    `telecom-webhook-security`, `bank-webhook-security`) each pick "the
    first non-Vodacom telecom operator" or "the first bank" as a shared
    fixture and mutate its `api_key_hash`/`webhook_secret` in
    `beforeAll`/`afterAll`. Jest runs spec files in parallel workers by
    default, so two files claiming the same row race and can produce
    intermittent `401`s unrelated to any real bug — confirmed via
    `--runInBand` (passes every time) vs. default parallel execution
    (fails intermittently, reproduces with or without any newer spec
    file in the run). `telecom-dual-mode-savings.e2e-spec.ts` (added
    2026-09-02) avoids contributing to this by claiming the *last*
    non-Vodacom operator instead of the first, but the underlying
    shared-fixture pattern in the three older files wasn't otherwise
    touched — worth a shared per-suite fixture (or `--runInBand` in CI)
    before trusting this suite's parallel-run signal.
