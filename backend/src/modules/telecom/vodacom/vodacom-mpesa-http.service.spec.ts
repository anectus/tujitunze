import {
  VodacomApiError,
  VodacomMpesaHttpService,
} from './vodacom-mpesa-http.service';

function jsonResponse(status: number, body: unknown, ok = status < 300) {
  return {
    ok,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('VodacomMpesaHttpService', () => {
  let service: VodacomMpesaHttpService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new VodacomMpesaHttpService();
    fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('successful request: returns the parsed body and status', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { output_ResponseCode: 'OK' }),
    );

    const result = await service.request<{ output_ResponseCode: string }>({
      method: 'GET',
      url: 'https://example.test/session',
      timeoutMs: 1000,
      retryable: false,
      maxRetries: 0,
      correlationId: 'corr-1',
    });

    expect(result.status).toBe(200);
    expect(result.body.output_ResponseCode).toBe('OK');
  });

  it('rejected payment (HTTP error): throws a structured VodacomApiError carrying the response body, never retried', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { error: 'INSUFFICIENT_FUNDS' }, false),
    );

    await expect(
      service.request({
        method: 'POST',
        url: 'https://example.test/c2b',
        timeoutMs: 1000,
        retryable: true,
        maxRetries: 3,
        correlationId: 'corr-2',
      }),
    ).rejects.toMatchObject({
      kind: 'HTTP_ERROR',
      status: 400,
      responseBody: { error: 'INSUFFICIENT_FUNDS' },
    });

    // HTTP_ERROR is never retried even when retryable=true — Vodacom
    // gave a definitive answer, retrying can't change it.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('timeout: aborts after timeoutMs and surfaces a TIMEOUT-kind VodacomApiError', async () => {
    fetchMock.mockImplementation(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );

    await expect(
      service.request({
        method: 'POST',
        url: 'https://example.test/c2b',
        timeoutMs: 20,
        retryable: false,
        maxRetries: 0,
        correlationId: 'corr-3',
      }),
    ).rejects.toMatchObject({ kind: 'TIMEOUT' });
  });

  it('provider unavailable (network failure): retries a retryable call up to maxRetries, then surfaces NETWORK', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      service.request({
        method: 'GET',
        url: 'https://example.test/session',
        timeoutMs: 1000,
        retryable: true,
        maxRetries: 2,
        correlationId: 'corr-4',
      }),
    ).rejects.toMatchObject({ kind: 'NETWORK' });

    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('a non-retryable call (payment-initiating POST) never retries on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    await expect(
      service.request({
        method: 'POST',
        url: 'https://example.test/c2b',
        timeoutMs: 1000,
        retryable: false,
        maxRetries: 5,
        correlationId: 'corr-5',
      }),
    ).rejects.toThrow(VodacomApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('recovers on a retry: succeeds on the second attempt after one transient network failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await service.request<{ ok: boolean }>({
      method: 'GET',
      url: 'https://example.test/session',
      timeoutMs: 1000,
      retryable: true,
      maxRetries: 2,
      correlationId: 'corr-6',
    });

    expect(result.body.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never logs secret header values — only the header name is visible in logs', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    await service.request({
      method: 'POST',
      url: 'https://example.test/c2b',
      headers: { Authorization: 'Bearer super-secret-session-key' },
      timeoutMs: 1000,
      retryable: false,
      maxRetries: 0,
      correlationId: 'corr-7',
    });

    const loggedText = logSpy.mock.calls
      .map((call) => call.join(' '))
      .join('\n');
    expect(loggedText).not.toContain('super-secret-session-key');
  });

  it('generateCorrelationId produces a unique value per call', () => {
    const id1 = service.generateCorrelationId();
    const id2 = service.generateCorrelationId();
    expect(id1).not.toBe(id2);
  });
});
