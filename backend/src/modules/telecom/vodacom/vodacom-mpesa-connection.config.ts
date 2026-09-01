import { ConfigService } from '@nestjs/config';

// Real Vodacom M-Pesa Tanzania sandbox connection config — the exact
// env var names given in this integration's official documentation.
//
// This is deliberately separate from the earlier, still-dormant
// backend/src/modules/payments/vodacom-mpesa/vodacom-mpesa.config.ts
// (built before any real endpoint/credential details were available,
// and whose concrete calls all still throw
// VodacomEndpointNotDocumentedError). Reconciling the two into one
// config is natural follow-up work once C2B/B2C are added in a later
// step; for this step, this file is the single source of truth for the
// real, working session-key connection.
export type VodacomMpesaEnvironment = 'sandbox' | 'production';

export interface VodacomMpesaConnectionConfig {
  environment: VodacomMpesaEnvironment;
  baseUrl: string | null;
  market: string | null;
  apiKey: string | null;
  publicKey: string | null;
  origin: string | null;
  timeoutMs: number;
  maxRetries: number;
  // C2B-specific — not required for session generation, only for the
  // C2B Single Stage call. Vodacom's portal issues this alongside the
  // API key; kept configurable per-environment (never hardcoded), per
  // the documented requirement.
  serviceProviderCode: string | null;
  // Vodacom's documentation does not state a SessionKey TTL. These are
  // TUJITUNZE's own conservative, configurable operational assumptions
  // (not a documented Vodacom fact) used to avoid requesting a new
  // SessionKey for every C2B call — see VodacomSessionCacheService.
  sessionCacheTtlSeconds: number;
  sessionCacheRefreshMarginSeconds: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_SESSION_CACHE_TTL_SECONDS = 3000; // 50 minutes — placeholder until Vodacom documents a real TTL.
const DEFAULT_SESSION_CACHE_REFRESH_MARGIN_SECONDS = 120;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadVodacomMpesaConnectionConfig(
  configService: ConfigService,
): VodacomMpesaConnectionConfig {
  const environment = (
    configService.get<string>('VODACOM_MPESA_ENV') ?? 'sandbox'
  )
    .trim()
    .toLowerCase();

  return {
    // Fails closed to sandbox on any unrecognized value, same rule as
    // established for the rest of this integration — production must
    // never be entered accidentally.
    environment: environment === 'production' ? 'production' : 'sandbox',
    baseUrl: configService.get<string>('VODACOM_MPESA_BASE_URL') || null,
    market: configService.get<string>('VODACOM_MPESA_MARKET') || null,
    apiKey: configService.get<string>('VODACOM_MPESA_API_KEY') || null,
    publicKey: configService.get<string>('VODACOM_MPESA_PUBLIC_KEY') || null,
    origin: configService.get<string>('VODACOM_MPESA_ORIGIN') || null,
    timeoutMs: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_TIMEOUT_MS'),
      DEFAULT_TIMEOUT_MS,
    ),
    maxRetries: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_MAX_RETRIES'),
      DEFAULT_MAX_RETRIES,
    ),
    serviceProviderCode:
      configService.get<string>('VODACOM_MPESA_SERVICE_PROVIDER_CODE') || null,
    sessionCacheTtlSeconds: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_SESSION_LIFETIME_SECONDS'),
      DEFAULT_SESSION_CACHE_TTL_SECONDS,
    ),
    sessionCacheRefreshMarginSeconds: parsePositiveInt(
      configService.get<string>('VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS'),
      DEFAULT_SESSION_CACHE_REFRESH_MARGIN_SECONDS,
    ),
  };
}

export function isVodacomMpesaConnectionConfigured(
  config: VodacomMpesaConnectionConfig,
): boolean {
  return !!(config.baseUrl && config.market && config.apiKey && config.origin);
}

// C2B needs everything session generation needs, PLUS the public key
// (to encrypt the SessionKey for the Authorization header) and the
// Service Provider Code (a required C2B request field). Checked
// separately from the two functions above so a C2B attempt can report
// exactly which of the three credential classes is missing.
export function isVodacomMpesaC2BConfigured(
  config: VodacomMpesaConnectionConfig,
): boolean {
  return (
    isVodacomMpesaConnectionConfigured(config) &&
    isVodacomMpesaPublicKeyConfigured(config) &&
    !!config.serviceProviderCode
  );
}

// The public key is checked separately from the rest of the connection
// config (rather than folded into isVodacomMpesaConnectionConfigured)
// so a missing API Key vs. a missing public key can be reported as
// distinct, specific blockers rather than one generic "not configured"
// message — directly useful for the "VODACOM CREDENTIALS REQUIRED"
// reporting this integration requires.
export function isVodacomMpesaPublicKeyConfigured(
  config: VodacomMpesaConnectionConfig,
): boolean {
  return !!config.publicKey;
}

// The sandbox getSession path is confirmed by the official
// documentation for this exact market:
//   GET /sandbox/ipg/v2/vodacomTZN/getSession/
// The production equivalent's exact path segment (whether it is
// "openapi", "ipg", or something else in place of "sandbox") has NOT
// been documented for this integration — guessing it would violate the
// explicit "do not invent undocumented Vodacom endpoints" rule, so
// production is deliberately unsupported here until that path is
// confirmed.
export function buildGetSessionPath(
  config: VodacomMpesaConnectionConfig,
): string {
  if (config.environment === 'production') {
    throw new Error(
      'The production getSession endpoint path has not been documented for this integration — only the sandbox path (/sandbox/ipg/v2/{market}/getSession/) is confirmed. Do not guess the production path.',
    );
  }
  return `/sandbox/ipg/v2/${config.market}/getSession/`;
}

// Verified sandbox C2B Single Stage path, confirmed by the same
// official documentation:
//   POST /sandbox/ipg/v2/vodacomTZN/c2bPayment/singleStage/
// Same production-path caveat as buildGetSessionPath above.
export function buildC2BSingleStagePath(
  config: VodacomMpesaConnectionConfig,
): string {
  if (config.environment === 'production') {
    throw new Error(
      'The production C2B Single Stage endpoint path has not been documented for this integration — only the sandbox path (/sandbox/ipg/v2/{market}/c2bPayment/singleStage/) is confirmed. Do not guess the production path.',
    );
  }
  return `/sandbox/ipg/v2/${config.market}/c2bPayment/singleStage/`;
}

export function buildQueryTransactionStatusPath(
  config: VodacomMpesaConnectionConfig,
): string {
  if (config.environment === 'production') {
    throw new Error(
      'The production queryTransactionStatus endpoint path has not been documented for this integration — only the sandbox path is confirmed. Do not guess the production path.',
    );
  }
  return `/sandbox/ipg/v2/${config.market}/queryTransactionStatus/`;
}

export function buildReversalPath(
  config: VodacomMpesaConnectionConfig,
): string {
  if (config.environment === 'production') {
    throw new Error(
      'The production reversal endpoint path has not been documented for this integration — only the sandbox path is confirmed. Do not guess the production path.',
    );
  }
  return `/sandbox/ipg/v2/${config.market}/reversal/`;
}

// Fixed for this integration — TUJITUNZE only supports the Vodacom
// Tanzania market (vodacomTZN), so country/currency are constants tied
// to that market rather than independently configurable env vars.
export const VODACOM_MPESA_C2B_COUNTRY = 'TZN';
export const VODACOM_MPESA_C2B_CURRENCY = 'TZS';
