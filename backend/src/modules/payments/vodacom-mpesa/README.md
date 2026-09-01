# Vodacom M-Pesa Integration

The live Vodacom C2B integration is implemented under
`backend/src/modules/telecom/vodacom/`. `POST
/telecom/mpesa/transactions/:id/query` performs the documented
`queryTransactionStatus` call using the existing cached SessionKey.
Status queries are retryable because they are read-only; payment
initiation remains non-retryable.

Only a provider-confirmed success is allowed to credit the Health
Wallet. The payment row is locked during finalization, the wallet
transaction reference is unique, and an existing credit is detected
before any new wallet write. Confirmed success/failure is marked
`Reconciled`; timeouts, network errors, and unknown provider responses
remain `PENDING` and are audit-logged without crediting the wallet.

## Historical implementation boundary

The older provider-agnostic adapter in this directory still contains
the unimplemented operations that predate the verified C2B integration.
The live C2B and status-query implementation uses the verified
connection/session services in `telecom/vodacom`; do not add a second
Vodacom payment architecture here.

## What is real today

| Piece | File | Status |
|---|---|---|
| Configuration loading/validation | `vodacom-mpesa.config.ts` | Real, tested |
| Session-key caching, proactive renewal, concurrent-call de-duplication | `vodacom-session.service.ts` | Real, tested |
| HTTP client: correlation IDs, timeouts, safe-only retry policy, structured errors, secret-masked logging | `vodacom-mpesa-http.service.ts` | Real, tested |
| Idempotency check + `payment_transactions` persistence | `vodacom-transaction-recorder.service.ts` | Real, tested |
| Provider-agnostic interface (`MpesaApiClient`) | `vodacom-mpesa.types.ts` | Real |
| Concrete Vodacom adapter orchestration | `vodacom-mpesa.service.ts` | Real up to the documented boundary; actual wire calls throw |

## Configuration

All values come from environment variables (`backend/.env.example`) —
never hardcoded, never committed. See `.env.example` for the full list
with inline explanations:

```
VODACOM_MPESA_ENV=sandbox            # must be exactly "production" to leave sandbox; anything else fails closed
VODACOM_MPESA_API_BASE_URL=          # sandbox and production are different hosts
VODACOM_MPESA_API_KEY=               # never logged, never persisted, never returned in a response
VODACOM_MPESA_APPLICATION_ID=        # the registered application/service-provider identifier
VODACOM_MPESA_SESSION_PATH=          # session-generation endpoint path — REQUIRED, no default
VODACOM_MPESA_SESSION_LIFETIME_SECONDS=3000
VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS=120
VODACOM_MPESA_TIMEOUT_MS=15000
VODACOM_MPESA_MAX_RETRIES=2
```

`isVodacomMpesaConfigured()` (`vodacom-mpesa.config.ts`) returns `true`
only once every required value above is set. Every `VodacomMpesaService`
method checks this first and fails closed with `503 Service Unavailable`
if not — the exact same pattern this project's existing
`SmsService`/mail config already use for an unconfigured provider (see
`backend/src/modules/auth/sms.service.ts`), not a new convention.

**Sandbox vs. production is never a single flag on a shared base URL.**
`VODACOM_MPESA_API_BASE_URL` for sandbox and for production must be two
genuinely different values, matching Vodacom's actual sandbox/production
hosts once known.

## How the session flow is meant to work

Generic OAuth-like shape (as described by Vodacom's own developer
portal): an Application/API Key is exchanged for a short-lived Session
Key, which authenticates every subsequent call until it expires.

`VodacomSessionService.getSessionKey()`:

1. Returns the cached key if it is not within
   `VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS` of its recorded
   expiry.
2. Otherwise calls `MpesaApiClient.generateSession()` — a single
   in-flight refresh is shared by any concurrent callers, so a burst of
   simultaneous requests never triggers more than one real session call.
3. Caches the new key + expiry in memory only. **A session key is never
   written to the database or to any log line** — it is itself a bearer
   credential, held only for the life of the Node process.
4. `invalidate()` can force a fresh session on the next call, for when
   Vodacom rejects a call as unauthenticated even though the locally
   cached expiry hadn't been reached yet.

`generateSession()` itself, on the concrete Vodacom client, currently
throws `VodacomEndpointNotDocumentedError` — the caching logic above is
real and tested against a fake client; only the actual HTTP call to
Vodacom is not yet implemented.

## How C2B / B2C / B2B are meant to be used

All four conceptual operations follow the same shape
(`MpesaApiClient` in `vodacom-mpesa.types.ts`):

```ts
createC2BPayment(request: C2BPaymentRequest): Promise<MpesaTransactionResult>
createB2CPayment(request: B2CPaymentRequest): Promise<MpesaTransactionResult>
createB2BPayment(request: B2BPaymentRequest): Promise<MpesaTransactionResult>
```

Each request carries `internalReference` — TUJITUNZE's own idempotency/
correlation key, generated before Vodacom's own transaction ID is known.
`VodacomMpesaService`:

1. Checks `payment_transactions` for an existing row with this
   `internal_reference`. If found, returns its recorded outcome
   immediately — **no second attempt, no second charge, no second
   allocation** — this is the idempotency guarantee, and it is real and
   tested today, independent of whether the underlying Vodacom call
   works.
2. If not found, validates configuration (503 if missing).
3. Resolves the `telecom_operators` row for `'Vodacom'` and inserts a
   `payment_transactions` row with `status = 'INITIATED'`,
   `channel = 'MOBILE_MONEY'`, `provider = 'VODACOM_MPESA'` — a real,
   honest record that an attempt was prepared.
4. Attempts the real Vodacom call — today, this throws
   `VodacomEndpointNotDocumentedError`, and the row is updated to
   `status = 'FAILED'` with that exact reason. **No row is ever marked
   `SUCCESSFUL` unless a real Vodacom response says so** — the database
   itself enforces this: `payment_transactions_external_id_required_for_success`
   (migration 0021) rejects any attempt to mark a row `SUCCESSFUL`
   without a real provider transaction ID recorded.

## How transaction status is meant to be verified

`queryTransaction({ providerTransactionId })` is read-only/idempotent —
safe to retry automatically on a transport-level failure (network error,
timeout), unlike C2B/B2C/B2B which are never auto-retried (see
"Retry policy" below). This is the documented recovery path for an
ambiguous C2B/B2C/B2B outcome: if a payment-initiating call times out,
the correct next step is a status query using the same reference, never
a blind resend of the original request.

## How reversals are meant to work

`reverseTransaction({ originalProviderTransactionId, internalReference,
amount, reason })` — not yet implemented against a real endpoint for
the same documentation-gap reason as everything else. The original
`payment_transactions` row is never deleted or overwritten by a
reversal; `reversal_reference` (already part of the schema) is the
column a reversal would populate to link the two rows once this is
wired up.

## Retry policy (real, implemented, tested)

`VodacomMpesaHttpService.request()` takes a `retryable` flag:

- **Retryable** (session generation, transaction status query): retried
  up to `VODACOM_MPESA_MAX_RETRIES` times on a network-level failure or
  timeout. A definitive HTTP error response (Vodacom said no) is never
  retried, retryable or not.
- **Never retryable** (C2B, B2C, B2B): a timeout or network failure on
  one of these is surfaced immediately as an ambiguous failure. TUJITUNZE
  does not know whether Vodacom received and acted on the request, so
  blindly resending it could double-submit real money. The correct
  recovery is `queryTransaction()` against the same reference.

## Sandbox testing process

Vodacom's real sandbox has not been reached by this code — see "Why the
real calls throw" above. Once endpoint documentation is supplied:

1. Set `VODACOM_MPESA_ENV=sandbox` and the sandbox `VODACOM_MPESA_API_BASE_URL`.
2. Use Vodacom's documented sandbox test MSISDNs/scenarios (never a real
   customer number) to exercise successful, rejected, timeout, and
   insufficient-balance outcomes.
3. `VodacomMpesaService`'s unit tests (`*.spec.ts` in this directory)
   already exercise the surrounding logic (idempotency, config
   validation, honest FAILED recording) against a fake client — the
   real integration test to add once documented is one that injects the
   real `VodacomMpesaService` and asserts against Vodacom's actual
   sandbox responses, not a fake.

## Production approval requirements

Per Vodacom's own developer portal (as described in the task, not
independently verified by this codebase): production access requires
linking the registered developer application to the actual registered
business/organisation and receiving M-Pesa's approval. Nothing in this
codebase can or should bypass that — `VODACOM_MPESA_ENV` defaults to,
and fails closed to, `sandbox` specifically so a production credential
can never be exercised by accident.
