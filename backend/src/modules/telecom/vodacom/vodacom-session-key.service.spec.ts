import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { VodacomSessionKeyService } from './vodacom-session-key.service';
import {
  VodacomApiError,
  VodacomHttpRequestOptions,
  VodacomHttpResponse,
  VodacomMpesaHttpService,
} from './vodacom-mpesa-http.service';

type RequestMock = jest.Mock<
  Promise<VodacomHttpResponse<unknown>>,
  [VodacomHttpRequestOptions]
>;
type LogSpy = jest.SpyInstance<void, unknown[]>;

const REAL_PUBLIC_KEY_BASE64 =
  'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArv9yxA69XQKBo24BaF/D+fvlqmGdYjqLQ5WtNBb5tquqGvAvG3WMFETVUSow/LizQalxj2ElMVrUmzu5mGGkxK08bWEXF7a1DEvtVJs6nppIlFJc2SnrU14AOrIrB28ogm58JjAl5BOQawOXD5dfSk7MaAA82pVHoIqEu0FxA8BOKU+RGTihRU+ptw1j4bsAJYiPbSX6i71gfPvwHPYamM0bfI4CmlsUUR3KvCG24rB6FNPcRBhM3jDuv8ae2kC33w9hEq8qNB55uw51vK7hyXoAa+U7IqP1y6nBdlN25gkxEA8yrsl1678cspeXr+3ciRyqoRgj9RD/ONbJhhxFvt1cLBh+qwK2eqISfBb06eRnNeC71oBokDm3zyCnkOtMDGl7IvnMfZfEPFCfg5QgJVk1msPpRvQxmEsrX9MQRyFVzgy2CWNIb7c+jPapyrNwoUbANlN8adU1m6yOuoX7F49x+OjiG2se0EJ6nafeKUXw/+hiJZvELUYgzKUtMAZVTNZfT8jjb58j8GVtuS+6TM2AutbejaCV84ZK58E2CRJqhmjQibEUO6KPdD7oTlEkFy52Y1uOOBXgYpqMzufNPmfdqqqSM4dU70PO8ogyKGiLAIxCetMjjm6FCMEA3Kc8K0Ig7/XtFm9By6VxTJK1Mg36TlHaZKP6VzVLXMtesJECAwEAAQ==';

const FULL_CONFIG_VALUES: Record<string, string> = {
  VODACOM_MPESA_ENV: 'sandbox',
  VODACOM_MPESA_BASE_URL: 'https://openapi.m-pesa.com',
  VODACOM_MPESA_MARKET: 'vodacomTZN',
  VODACOM_MPESA_API_KEY: 'real-looking-test-api-key',
  VODACOM_MPESA_PUBLIC_KEY: REAL_PUBLIC_KEY_BASE64,
  VODACOM_MPESA_ORIGIN: 'https://tujitunze.example.test',
  VODACOM_MPESA_TIMEOUT_MS: '1000',
  VODACOM_MPESA_MAX_RETRIES: '1',
};

function fakeConfigService(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('VodacomSessionKeyService', () => {
  let httpService: {
    request: RequestMock;
    generateCorrelationId: jest.Mock<string, []>;
  };
  let logSpy: LogSpy;
  let warnSpy: LogSpy;
  let errorSpy: LogSpy;

  const buildService = (configValues: Record<string, string> = {}) => {
    httpService = {
      request: jest.fn() as RequestMock,
      generateCorrelationId: jest.fn(() => 'test-correlation-id'),
    };
    return new VodacomSessionKeyService(
      httpService as unknown as VodacomMpesaHttpService,
      fakeConfigService(configValues),
    );
  };

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const allLoggedText = () =>
    [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
      .map((call) => call.join(' '))
      .join('\n');

  it('successful SessionKey response: INS-0 + output_SessionID -> success with the real session key', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'Request processed successfully',
        output_SessionID: 'REAL-SESSION-KEY-VALUE',
      },
      correlationId: 'corr-1',
      durationMs: 42,
    });

    const result = await service.generateSession();

    expect(result).toMatchObject({
      success: true,
      sessionKey: 'REAL-SESSION-KEY-VALUE',
      httpStatus: 200,
      responseCode: 'INS-0',
    });

    // Verifies the actual outgoing request shape: correct URL, headers,
    // and that a real RSA-encrypted (not raw) API key is in the
    // Authorization header.
    const [callArgs] = httpService.request.mock.calls[0];
    expect(callArgs.method).toBe('GET');
    expect(callArgs.url).toBe(
      'https://openapi.m-pesa.com/sandbox/ipg/v2/vodacomTZN/getSession/',
    );
    expect(callArgs.headers['Content-Type']).toBe('application/json');
    expect(callArgs.headers.Origin).toBe('https://tujitunze.example.test');
    expect(callArgs.headers.Authorization).toMatch(/^Bearer .+/);
    expect(callArgs.headers.Authorization).not.toContain(
      'real-looking-test-api-key',
    );
    expect(callArgs.retryable).toBe(true);
  });

  it('the real SessionKey is never logged', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'Request processed successfully',
        output_SessionID: 'TOTALLY-SECRET-SESSION-KEY',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    await service.generateSession();

    expect(allLoggedText()).not.toContain('TOTALLY-SECRET-SESSION-KEY');
  });

  it('the API key and encrypted API key are never logged', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'ok',
        output_SessionID: 'session-1',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    await service.generateSession();

    const [callArgs] = httpService.request.mock.calls[0];
    const encryptedKey = (callArgs.headers?.Authorization ?? '').replace(
      'Bearer ',
      '',
    );

    const logged = allLoggedText();
    expect(logged).not.toContain('real-looking-test-api-key');
    expect(logged).not.toContain(encryptedKey);
  });

  it('HTTP 400 + INS-989: reports a documented failure, not a thrown exception, and never a success', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockRejectedValue(
      new VodacomApiError(
        'Vodacom M-Pesa returned HTTP 400',
        'corr-2',
        'HTTP_ERROR',
        400,
        {
          output_ResponseCode: 'INS-989',
          output_ResponseDesc: 'Session Creation Failed',
        },
      ),
    );

    const result = await service.generateSession();

    expect(result).toMatchObject({
      success: false,
      httpStatus: 400,
      responseCode: 'INS-989',
      errorKind: 'HTTP_ERROR',
    });
  });

  it('missing API key: rejects with ServiceUnavailableException before ever calling Vodacom', async () => {
    const { VODACOM_MPESA_API_KEY: _omit, ...partial } = FULL_CONFIG_VALUES;
    const service = buildService(partial);

    await expect(service.generateSession()).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('missing API key: the error message names exactly which credential is missing', async () => {
    const { VODACOM_MPESA_API_KEY: _omit, ...partial } = FULL_CONFIG_VALUES;
    const service = buildService(partial);

    await expect(service.generateSession()).rejects.toThrow(
      /VODACOM_MPESA_API_KEY/,
    );
  });

  it('missing public key: rejects with ServiceUnavailableException naming VODACOM_MPESA_PUBLIC_KEY', async () => {
    const { VODACOM_MPESA_PUBLIC_KEY: _omit, ...partial } = FULL_CONFIG_VALUES;
    const service = buildService(partial);

    await expect(service.generateSession()).rejects.toThrow(
      /VODACOM_MPESA_PUBLIC_KEY/,
    );
    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('malformed public key: returns a failure result rather than throwing an unhandled crypto error', async () => {
    const service = buildService({
      ...FULL_CONFIG_VALUES,
      VODACOM_MPESA_PUBLIC_KEY: 'not-a-real-key',
    });

    const result = await service.generateSession();

    expect(result).toMatchObject({
      success: false,
      errorKind: 'INVALID_RESPONSE',
    });
    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('network timeout: reports a TIMEOUT failure, not a thrown exception', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockRejectedValue(
      new VodacomApiError('timed out', 'corr-3', 'TIMEOUT'),
    );

    const result = await service.generateSession();

    expect(result).toMatchObject({ success: false, errorKind: 'TIMEOUT' });
  });

  it('Vodacom unavailable (network error): reports a NETWORK failure', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockRejectedValue(
      new VodacomApiError('ECONNREFUSED', 'corr-4', 'NETWORK'),
    );

    const result = await service.generateSession();

    expect(result).toMatchObject({ success: false, errorKind: 'NETWORK' });
  });

  it('invalid response: HTTP 200 but missing output_SessionID never becomes a success', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockResolvedValue({
      status: 200,
      body: { output_ResponseCode: 'INS-0', output_ResponseDesc: 'ok' },
      correlationId: 'corr-5',
      durationMs: 10,
    });

    const result = await service.generateSession();

    expect(result).toMatchObject({
      success: false,
      errorKind: 'INVALID_RESPONSE',
    });
  });

  it('invalid response: HTTP 200 with an unrecognized response code never becomes a success', async () => {
    const service = buildService(FULL_CONFIG_VALUES);
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-999',
        output_ResponseDesc: 'unexpected',
        output_SessionID: 'should-not-be-trusted',
      },
      correlationId: 'corr-6',
      durationMs: 10,
    });

    const result = await service.generateSession();

    expect(result.success).toBe(false);
  });
});
