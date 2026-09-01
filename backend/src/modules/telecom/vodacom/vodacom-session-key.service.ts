import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  VodacomApiError,
  VodacomMpesaHttpService,
} from './vodacom-mpesa-http.service';
import {
  buildGetSessionPath,
  isVodacomMpesaConnectionConfigured,
  isVodacomMpesaPublicKeyConfigured,
  loadVodacomMpesaConnectionConfig,
} from './vodacom-mpesa-connection.config';
import { encryptApiKeyForVodacom } from './vodacom-rsa-encryption.util';

// Documented, exact response shape for GET .../getSession/ per the
// official Vodacom M-Pesa OpenAPI documentation provided for this
// integration. No other fields are assumed present.
interface VodacomGetSessionResponseBody {
  output_ResponseCode?: string;
  output_ResponseDesc?: string;
  output_SessionID?: string;
}

const SUCCESS_RESPONSE_CODE = 'INS-0';
// Exported so callers that need to distinguish "Vodacom rejected the
// credential" from a generic connection failure (e.g. the Telecom
// connection-test endpoint) don't have to duplicate this magic string.
export const SESSION_CREATION_FAILED_CODE = 'INS-989';

export type VodacomSessionErrorKind =
  'NOT_CONFIGURED' | 'HTTP_ERROR' | 'NETWORK' | 'TIMEOUT' | 'INVALID_RESPONSE';

export type VodacomSessionResult =
  | {
      success: true;
      sessionKey: string;
      httpStatus: number;
      responseCode: string;
      responseDesc: string;
    }
  | {
      success: false;
      httpStatus: number | null;
      responseCode: string | null;
      responseDesc: string | null;
      errorKind: VodacomSessionErrorKind;
      message: string;
    };

// Real Vodacom M-Pesa Tanzania sandbox SessionKey generation —
// GET /sandbox/ipg/v2/vodacomTZN/getSession/, per the official
// documentation provided for this integration. This is NOT a mock:
// when configured, this issues a genuine HTTPS request to Vodacom's
// sandbox.
//
// This service always issues a fresh request — caching/reuse across
// multiple calls (C2B) is handled by the dedicated
// VodacomSessionCacheService, which wraps this service rather than
// duplicating its request logic. The SessionKey itself is never
// persisted to the database or written to any log line here or
// anywhere in this file, satisfying "do not permanently store it as if
// it were a long-term credential."
@Injectable()
export class VodacomSessionKeyService {
  private readonly logger = new Logger(VodacomSessionKeyService.name);

  constructor(
    private readonly httpService: VodacomMpesaHttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateSession(): Promise<VodacomSessionResult> {
    const config = loadVodacomMpesaConnectionConfig(this.configService);

    if (!isVodacomMpesaConnectionConfigured(config)) {
      const missing: string[] = [];
      if (!config.baseUrl) missing.push('VODACOM_MPESA_BASE_URL');
      if (!config.market) missing.push('VODACOM_MPESA_MARKET');
      if (!config.apiKey) missing.push('VODACOM_MPESA_API_KEY');
      if (!config.origin) missing.push('VODACOM_MPESA_ORIGIN');

      this.logger.warn(
        `Vodacom M-Pesa session request skipped: missing configuration (${missing.join(', ')}).`,
      );
      throw new ServiceUnavailableException(
        `Vodacom M-Pesa is not configured. Missing: ${missing.join(', ')}.`,
      );
    }

    if (!isVodacomMpesaPublicKeyConfigured(config)) {
      this.logger.warn(
        'Vodacom M-Pesa session request skipped: missing VODACOM_MPESA_PUBLIC_KEY.',
      );
      throw new ServiceUnavailableException(
        'Vodacom M-Pesa is not configured. Missing: VODACOM_MPESA_PUBLIC_KEY.',
      );
    }

    const correlationId = this.httpService.generateCorrelationId();

    let encryptedApiKey: string;
    try {
      // config.apiKey/publicKey are asserted non-null by the checks
      // above (isVodacomMpesaConnectionConfigured /
      // isVodacomMpesaPublicKeyConfigured).
      encryptedApiKey = encryptApiKeyForVodacom(
        config.apiKey as string,
        config.publicKey as string,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown encryption error';
      this.logger.error(
        `Vodacom M-Pesa session request failed: correlationId=${correlationId} reason=public-key-encryption-error`,
      );
      return {
        success: false,
        httpStatus: null,
        responseCode: null,
        responseDesc: null,
        errorKind: 'INVALID_RESPONSE',
        message,
      };
    }

    const url = `${config.baseUrl}${buildGetSessionPath(config)}`;

    this.logger.log(
      `Vodacom M-Pesa session request attempt: correlationId=${correlationId} environment=${config.environment} market=${config.market}`,
    );

    try {
      const response =
        await this.httpService.request<VodacomGetSessionResponseBody>({
          method: 'GET',
          url,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${encryptedApiKey}`,
            Origin: config.origin as string,
          },
          timeoutMs: config.timeoutMs,
          // Session generation is read-only/idempotent from TUJITUNZE's
          // side (it doesn't move money), so retrying on a transient
          // network failure is safe — unlike a payment-initiating call.
          retryable: true,
          maxRetries: config.maxRetries,
          correlationId,
        });

      const body = response.body ?? {};
      const responseCode = body.output_ResponseCode ?? null;
      const responseDesc = body.output_ResponseDesc ?? null;

      if (responseCode === SUCCESS_RESPONSE_CODE && body.output_SessionID) {
        this.logger.log(
          `Vodacom M-Pesa session request result: correlationId=${correlationId} httpStatus=${response.status} responseCode=${responseCode} success=true`,
        );
        return {
          success: true,
          sessionKey: body.output_SessionID,
          httpStatus: response.status,
          responseCode,
          responseDesc: responseDesc ?? '',
        };
      }

      // HTTP 200 but the documented success shape isn't actually
      // present — never fabricate a session from this. Treated as a
      // failure, not a thrown exception, since Vodacom DID respond.
      this.logger.warn(
        `Vodacom M-Pesa session request result: correlationId=${correlationId} httpStatus=${response.status} responseCode=${responseCode ?? 'MISSING'} success=false reason=unexpected-response-shape`,
      );
      return {
        success: false,
        httpStatus: response.status,
        responseCode,
        responseDesc,
        errorKind: 'INVALID_RESPONSE',
        message:
          'Vodacom M-Pesa returned an HTTP 200 response that did not match the documented success shape (missing output_ResponseCode=INS-0 or output_SessionID).',
      };
    } catch (error) {
      return this.toFailureResult(error, correlationId);
    }
  }

  private toFailureResult(
    error: unknown,
    correlationId: string,
  ): VodacomSessionResult {
    if (error instanceof VodacomApiError) {
      if (error.kind === 'HTTP_ERROR') {
        const body = error.responseBody as
          VodacomGetSessionResponseBody | undefined;
        const responseCode = body?.output_ResponseCode ?? null;
        const responseDesc = body?.output_ResponseDesc ?? null;

        this.logger.warn(
          `Vodacom M-Pesa session request result: correlationId=${correlationId} httpStatus=${error.status} responseCode=${responseCode ?? 'UNKNOWN'} success=false`,
        );

        return {
          success: false,
          httpStatus: error.status ?? null,
          responseCode,
          responseDesc,
          errorKind: 'HTTP_ERROR',
          message:
            responseCode === SESSION_CREATION_FAILED_CODE
              ? 'Vodacom M-Pesa reported session creation failed (INS-989).'
              : `Vodacom M-Pesa returned an error response (HTTP ${error.status}).`,
        };
      }

      this.logger.error(
        `Vodacom M-Pesa session request result: correlationId=${correlationId} success=false errorKind=${error.kind}`,
      );
      return {
        success: false,
        httpStatus: null,
        responseCode: null,
        responseDesc: null,
        errorKind: error.kind === 'TIMEOUT' ? 'TIMEOUT' : 'NETWORK',
        message:
          error.kind === 'TIMEOUT'
            ? 'Vodacom M-Pesa session request timed out.'
            : 'Vodacom M-Pesa is unavailable (network error).',
      };
    }

    this.logger.error(
      `Vodacom M-Pesa session request result: correlationId=${correlationId} success=false errorKind=UNKNOWN`,
    );
    return {
      success: false,
      httpStatus: null,
      responseCode: null,
      responseDesc: null,
      errorKind: 'NETWORK',
      message: 'An unexpected error occurred while contacting Vodacom M-Pesa.',
    };
  }
}
