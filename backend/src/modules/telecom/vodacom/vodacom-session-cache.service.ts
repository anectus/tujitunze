import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { VodacomSessionKeyService } from './vodacom-session-key.service';
import { loadVodacomMpesaConnectionConfig } from './vodacom-mpesa-connection.config';

// SessionKey caching/deduplication for C2B — VodacomSessionKeyService
// always issues a fresh request; this service decides WHEN a fresh
// request is actually needed, so TUJITUNZE does not request a new
// SessionKey for every C2B call.
//
// Held only in process memory — a session key is itself a bearer
// credential and is never persisted to the database or logged, same
// rule already applied to webhook secrets/API keys elsewhere in this
// project.
@Injectable()
export class VodacomSessionCacheService {
  private readonly logger = new Logger(VodacomSessionCacheService.name);

  private cachedSessionKey: string | null = null;
  private expiresAtMs: number | null = null;
  // De-duplicates concurrent callers during a refresh so a burst of
  // simultaneous C2B calls triggers exactly one generateSession()
  // request, not one per caller.
  private inFlightRefresh: Promise<string> | null = null;

  constructor(
    private readonly sessionKeyService: VodacomSessionKeyService,
    private readonly configService: ConfigService,
  ) {}

  async getSessionKey(): Promise<string> {
    if (this.hasValidCachedSession()) {
      return this.cachedSessionKey as string;
    }

    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    this.inFlightRefresh = this.refresh();
    try {
      return await this.inFlightRefresh;
    } finally {
      this.inFlightRefresh = null;
    }
  }

  // Forces the next getSessionKey() call to fetch a fresh session. Only
  // safe to call after an HTTP-level 401/403 (an unambiguous "your
  // credential was rejected" signal) — there is no documented Vodacom
  // response code for "session expired" to react to more precisely.
  invalidate(): void {
    this.cachedSessionKey = null;
    this.expiresAtMs = null;
  }

  private hasValidCachedSession(): boolean {
    if (!this.cachedSessionKey || this.expiresAtMs === null) {
      return false;
    }
    const config = loadVodacomMpesaConnectionConfig(this.configService);
    const refreshAtMs =
      this.expiresAtMs - config.sessionCacheRefreshMarginSeconds * 1000;
    return Date.now() < refreshAtMs;
  }

  private async refresh(): Promise<string> {
    const config = loadVodacomMpesaConnectionConfig(this.configService);
    this.logger.log('Refreshing cached Vodacom M-Pesa SessionKey.');

    const result = await this.sessionKeyService.generateSession();
    if (!result.success) {
      throw new ServiceUnavailableException(
        `Unable to obtain a Vodacom M-Pesa SessionKey: ${result.message}`,
      );
    }

    this.cachedSessionKey = result.sessionKey;
    // Vodacom's documentation does not specify a SessionKey TTL — this
    // expiry is TUJITUNZE's own conservative operational assumption
    // (VODACOM_MPESA_SESSION_LIFETIME_SECONDS), refreshed proactively
    // ahead of the assumed expiry rather than waiting for Vodacom to
    // reject a stale key, since retrying a failed C2B POST is unsafe.
    this.expiresAtMs = Date.now() + config.sessionCacheTtlSeconds * 1000;
    return result.sessionKey;
  }
}
