import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

// Generic, provider-agnostic HTTP plumbing for the Vodacom M-Pesa
// integration: correlation IDs, timeout enforcement, a retry policy
// that is safe by construction, structured errors, and secret-masked
// logging. None of this requires knowing Vodacom's actual endpoint
// paths or payload shapes — it is real, working infrastructure today,
// independent of the "endpoint not documented" gap in
// VodacomMpesaService.

export interface VodacomHttpRequestOptions {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
  // Only ever true for read-only/idempotent calls (session generation,
  // transaction status query). A payment-initiating POST (C2B/B2C/B2B)
  // must never set this — if we time out or lose the connection after
  // sending it, we genuinely don't know whether Vodacom received and
  // acted on it, and blindly resending could double-submit real money.
  // The correct recovery for a non-idempotent call is a subsequent
  // queryTransaction() using the same internal_reference, not a retry
  // of the original request.
  retryable: boolean;
  maxRetries: number;
  correlationId: string;
}

export interface VodacomHttpResponse<T> {
  status: number;
  body: T;
  correlationId: string;
  durationMs: number;
}

// Distinguishes "we got a response, Vodacom said no" (structured,
// carries the response body) from "we never got a response at all"
// (network/timeout — ambiguous outcome, must not be treated as FAILED
// outright for a non-idempotent call).
export class VodacomApiError extends Error {
  constructor(
    message: string,
    public readonly correlationId: string,
    public readonly kind: 'NETWORK' | 'TIMEOUT' | 'HTTP_ERROR',
    public readonly status?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = 'VodacomApiError';
  }
}

const SECRET_HEADER_NAMES = new Set([
  'authorization',
  'apikey',
  'api-key',
  'x-api-key',
]);

// Never log secrets (API keys, session/bearer tokens, webhook
// secrets) — masks any header whose name suggests it carries a
// credential, regardless of value, rather than trying to enumerate
// every possible secret value.
function maskHeadersForLogging(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  if (!headers) return {};
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    masked[key] = SECRET_HEADER_NAMES.has(key.toLowerCase())
      ? '***REDACTED***'
      : value;
  }
  return masked;
}

@Injectable()
export class VodacomMpesaHttpService {
  private readonly logger = new Logger(VodacomMpesaHttpService.name);

  generateCorrelationId(): string {
    return `mpesa-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;
  }

  async request<T>(
    options: VodacomHttpRequestOptions,
  ): Promise<VodacomHttpResponse<T>> {
    const attempts = options.retryable
      ? Math.max(1, options.maxRetries + 1)
      : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        const response = await fetch(options.url, {
          method: options.method,
          headers: options.headers,
          body:
            options.body !== undefined
              ? JSON.stringify(options.body)
              : undefined,
          signal: controller.signal,
        });

        const durationMs = Date.now() - startedAt;
        let parsedBody: unknown = null;
        const text = await response.text();
        if (text) {
          try {
            parsedBody = JSON.parse(text);
          } catch {
            parsedBody = text;
          }
        }

        this.logger.log(
          `Vodacom M-Pesa request completed: correlationId=${options.correlationId} method=${options.method} status=${response.status} durationMs=${durationMs} headers=${JSON.stringify(maskHeadersForLogging(options.headers))}`,
        );

        if (!response.ok) {
          throw new VodacomApiError(
            `Vodacom M-Pesa returned HTTP ${response.status}`,
            options.correlationId,
            'HTTP_ERROR',
            response.status,
            parsedBody,
          );
        }

        return {
          status: response.status,
          body: parsedBody as T,
          correlationId: options.correlationId,
          durationMs,
        };
      } catch (error) {
        lastError = error;
        const isAbort = error instanceof Error && error.name === 'AbortError';
        const durationMs = Date.now() - startedAt;

        this.logger.error(
          `Vodacom M-Pesa request failed: correlationId=${options.correlationId} method=${options.method} attempt=${attempt}/${attempts} durationMs=${durationMs} kind=${isAbort ? 'TIMEOUT' : error instanceof VodacomApiError ? error.kind : 'NETWORK'}`,
        );

        // HTTP_ERROR (Vodacom responded, just with a non-2xx) is never
        // retried even on a retryable call — retries exist for
        // transport-level uncertainty, not for a definitive rejection.
        if (error instanceof VodacomApiError && error.kind === 'HTTP_ERROR') {
          throw error;
        }

        if (attempt >= attempts) {
          if (isAbort) {
            throw new VodacomApiError(
              `Vodacom M-Pesa request timed out after ${options.timeoutMs}ms`,
              options.correlationId,
              'TIMEOUT',
            );
          }
          throw new VodacomApiError(
            `Vodacom M-Pesa request failed: ${error instanceof Error ? error.message : 'unknown network error'}`,
            options.correlationId,
            'NETWORK',
          );
        }
        // Otherwise: retryable call, attempts remain — loop again.
      } finally {
        clearTimeout(timeout);
      }
    }

    // Unreachable in practice (the loop always returns or throws), but
    // keeps the function's return type honest for TypeScript.
    throw lastError instanceof Error
      ? lastError
      : new Error('Vodacom M-Pesa request failed');
  }
}
