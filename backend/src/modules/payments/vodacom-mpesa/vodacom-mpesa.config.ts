import { ConfigService } from '@nestjs/config';

// VODACOM M-PESA INTEGRATION FOUNDATION — configuration only.
//
// No Vodacom-specific endpoint path, header name, or request/response
// field name is hardcoded anywhere in this file or the rest of this
// module. A search of this entire repository (file names and content)
// found no Vodacom/M-Pesa API documentation, OpenAPI spec, or Postman
// collection — every technical detail of the real wire contract
// (session endpoint path and response shape, C2B/B2C/B2B/reversal/
// query endpoint paths and payload fields, header/signing scheme) is
// unverified and therefore deliberately left as configuration rather
// than a guessed literal. See VodacomEndpointNotDocumentedError in
// vodacom-mpesa.types.ts for where that boundary is enforced at
// runtime.

export type VodacomMpesaEnvironment = 'sandbox' | 'production';

export interface VodacomMpesaConfig {
  environment: VodacomMpesaEnvironment;

  // The registered application's base API URL — sandbox and production
  // are genuinely different hosts for this class of API, never the
  // same value with a flag, so a misconfigured environment can't
  // silently point at the wrong one.
  apiBaseUrl: string | null;

  // Never logged, never returned in any response, never persisted to
  // the database — held only in process memory for the lifetime of a
  // request/session-refresh.
  apiKey: string | null;

  // "Application configuration" — the registered app/service-provider
  // identifier Vodacom's portal issues alongside the API key. Kept
  // generic (not asserting a specific real field name like
  // "input_ServiceProviderCode") since that name is unverified.
  applicationId: string | null;

  // Path Vodacom's real session-generation endpoint would live at,
  // relative to apiBaseUrl. No default — if unset, session generation
  // fails closed (ServiceUnavailableException) rather than guessing.
  sessionPath: string | null;

  // How long a generated session is trusted for before this service
  // proactively refreshes it. Configurable per the requirement
  // ("configurable session lifetime") — not a Vodacom-documented fact,
  // just an operational tuning knob with a conservative default.
  sessionLifetimeSeconds: number;

  // How much earlier than the actual expiry to refresh — refreshing
  // exactly at expiry risks an in-flight request being rejected mid-
  // call by Vodacom.
  sessionRefreshMarginSeconds: number;

  timeoutMs: number;

  // Applies only to safe/idempotent calls (session generation,
  // transaction status query) — see VodacomMpesaHttpService. Payment-
  // initiating calls (C2B/B2C/B2B) are never automatically retried.
  maxRetries: number;
}

const DEFAULT_SESSION_LIFETIME_SECONDS = 3000; // 50 minutes — a conservative placeholder; the real value must come from Vodacom's documented session TTL once available.
const DEFAULT_SESSION_REFRESH_MARGIN_SECONDS = 120;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 2;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadVodacomMpesaConfig(
  configService: ConfigService,
): VodacomMpesaConfig {
  const environment = (
    configService.get<string>('VODACOM_MPESA_ENV') ?? 'sandbox'
  )
    .trim()
    .toLowerCase();

  return {
    // Fails closed to sandbox on any unrecognized value — the
    // requirement is explicit that production must never be entered
    // accidentally.
    environment: environment === 'production' ? 'production' : 'sandbox',
    apiBaseUrl: configService.get<string>('VODACOM_MPESA_API_BASE_URL') || null,
    apiKey: configService.get<string>('VODACOM_MPESA_API_KEY') || null,
    applicationId:
      configService.get<string>('VODACOM_MPESA_APPLICATION_ID') || null,
    sessionPath:
      configService.get<string>('VODACOM_MPESA_SESSION_PATH') || null,
    sessionLifetimeSeconds: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_SESSION_LIFETIME_SECONDS'),
      DEFAULT_SESSION_LIFETIME_SECONDS,
    ),
    sessionRefreshMarginSeconds: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS'),
      DEFAULT_SESSION_REFRESH_MARGIN_SECONDS,
    ),
    timeoutMs: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_TIMEOUT_MS'),
      DEFAULT_TIMEOUT_MS,
    ),
    maxRetries: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_MAX_RETRIES'),
      DEFAULT_MAX_RETRIES,
    ),
  };
}

// True only once every credential/endpoint value required to even
// ATTEMPT a real call is present. Does not (and cannot) verify those
// values are correct — only that the integration has been given
// something to work with instead of failing on missing config.
export function isVodacomMpesaConfigured(config: VodacomMpesaConfig): boolean {
  return !!(
    config.apiBaseUrl &&
    config.apiKey &&
    config.applicationId &&
    config.sessionPath
  );
}
