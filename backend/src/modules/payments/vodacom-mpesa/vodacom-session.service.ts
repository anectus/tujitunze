import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { loadVodacomMpesaConfig } from './vodacom-mpesa.config';
import { MPESA_API_CLIENT } from './vodacom-mpesa.types';
import type { MpesaApiClient } from './vodacom-mpesa.types';

// Session-key caching/renewal — real, tested logic independent of
// whether the underlying generateSession() call is itself implemented
// against a real Vodacom endpoint yet (it currently is not; see
// VodacomEndpointNotDocumentedError). Depends on the MpesaApiClient
// INTERFACE, not the concrete VodacomMpesaService, so this caching
// behavior is fully unit-testable with a fake client today and needs
// no changes once a real client implementation exists.
//
// Held only in process memory — a session key is itself a bearer
// credential and is never persisted to the database or logged, per the
// same "never store raw API secrets unnecessarily" rule this project
// already applies to webhook secrets/API keys.
@Injectable()
export class VodacomSessionService {
  private readonly logger = new Logger(VodacomSessionService.name);

  private cachedSessionKey: string | null = null;
  private expiresAt: Date | null = null;
  // De-duplicates concurrent callers during a refresh so a burst of
  // simultaneous requests triggers exactly one generateSession() call,
  // not one per caller.
  private inFlightRefresh: Promise<string> | null = null;

  constructor(
    @Inject(MPESA_API_CLIENT) private readonly client: MpesaApiClient,
    private readonly configService: ConfigService,
  ) {}

  async getSessionKey(): Promise<string> {
    if (this.hasValidCachedSession()) {
      return this.cachedSessionKey as string;
    }

    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    this.inFlightRefresh = this.refreshSession();
    try {
      return await this.inFlightRefresh;
    } finally {
      this.inFlightRefresh = null;
    }
  }

  // Forces the next getSessionKey() call to fetch a fresh session —
  // used when Vodacom rejects a call with an auth-expired-style error
  // even though our own cached expiry hadn't yet been reached (session
  // lifetimes are ultimately controlled by Vodacom, not us).
  invalidate(): void {
    this.cachedSessionKey = null;
    this.expiresAt = null;
  }

  private hasValidCachedSession(): boolean {
    if (!this.cachedSessionKey || !this.expiresAt) {
      return false;
    }
    const config = loadVodacomMpesaConfig(this.configService);
    const refreshAt =
      this.expiresAt.getTime() - config.sessionRefreshMarginSeconds * 1000;
    return Date.now() < refreshAt;
  }

  private async refreshSession(): Promise<string> {
    this.logger.log('Refreshing Vodacom M-Pesa session key.');
    const result = await this.client.generateSession();
    this.cachedSessionKey = result.sessionKey;
    this.expiresAt = result.expiresAt;
    return result.sessionKey;
  }
}
