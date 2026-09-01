import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { VodacomSessionCacheService } from './vodacom-session-cache.service';
import { VodacomSessionKeyService } from './vodacom-session-key.service';

function fakeConfigService(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('VodacomSessionCacheService', () => {
  let sessionKeyService: { generateSession: jest.Mock };

  const buildCache = (configValues: Record<string, string> = {}) => {
    sessionKeyService = { generateSession: jest.fn() };
    return new VodacomSessionCacheService(
      sessionKeyService as unknown as VodacomSessionKeyService,
      fakeConfigService(configValues),
    );
  };

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00.000Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches a fresh session key on the first call', async () => {
    const cache = buildCache();
    sessionKeyService.generateSession.mockResolvedValue({
      success: true,
      sessionKey: 'SESSION-1',
      httpStatus: 200,
      responseCode: 'INS-0',
      responseDesc: 'ok',
    });

    const key = await cache.getSessionKey();

    expect(key).toBe('SESSION-1');
    expect(sessionKeyService.generateSession).toHaveBeenCalledTimes(1);
  });

  it('reuses the cached session key on a second call within the TTL', async () => {
    const cache = buildCache();
    sessionKeyService.generateSession.mockResolvedValue({
      success: true,
      sessionKey: 'SESSION-1',
      httpStatus: 200,
      responseCode: 'INS-0',
      responseDesc: 'ok',
    });

    await cache.getSessionKey();
    const key = await cache.getSessionKey();

    expect(key).toBe('SESSION-1');
    expect(sessionKeyService.generateSession).toHaveBeenCalledTimes(1);
  });

  it('refreshes once the TTL (minus the refresh margin) has elapsed', async () => {
    const cache = buildCache({
      VODACOM_MPESA_SESSION_LIFETIME_SECONDS: '100',
      VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS: '10',
    });
    sessionKeyService.generateSession
      .mockResolvedValueOnce({
        success: true,
        sessionKey: 'SESSION-1',
        httpStatus: 200,
        responseCode: 'INS-0',
        responseDesc: 'ok',
      })
      .mockResolvedValueOnce({
        success: true,
        sessionKey: 'SESSION-2',
        httpStatus: 200,
        responseCode: 'INS-0',
        responseDesc: 'ok',
      });

    await cache.getSessionKey();
    jest.advanceTimersByTime(91 * 1000); // past (100 - 10)s refresh point
    const key = await cache.getSessionKey();

    expect(key).toBe('SESSION-2');
    expect(sessionKeyService.generateSession).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent callers into a single generateSession() call', async () => {
    const cache = buildCache();
    let resolveGenerate!: (value: unknown) => void;
    sessionKeyService.generateSession.mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      }),
    );

    const first = cache.getSessionKey();
    const second = cache.getSessionKey();

    resolveGenerate({
      success: true,
      sessionKey: 'SESSION-1',
      httpStatus: 200,
      responseCode: 'INS-0',
      responseDesc: 'ok',
    });

    const [firstKey, secondKey] = await Promise.all([first, second]);
    expect(firstKey).toBe('SESSION-1');
    expect(secondKey).toBe('SESSION-1');
    expect(sessionKeyService.generateSession).toHaveBeenCalledTimes(1);
  });

  it('throws ServiceUnavailableException without caching anything when the underlying session request fails', async () => {
    const cache = buildCache();
    sessionKeyService.generateSession.mockResolvedValue({
      success: false,
      httpStatus: null,
      responseCode: null,
      responseDesc: null,
      errorKind: 'NETWORK',
      message: 'Vodacom M-Pesa is unavailable (network error).',
    });

    await expect(cache.getSessionKey()).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(cache.getSessionKey()).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(sessionKeyService.generateSession).toHaveBeenCalledTimes(2);
  });

  it('invalidate() forces the next call to fetch a fresh session key', async () => {
    const cache = buildCache();
    sessionKeyService.generateSession
      .mockResolvedValueOnce({
        success: true,
        sessionKey: 'SESSION-1',
        httpStatus: 200,
        responseCode: 'INS-0',
        responseDesc: 'ok',
      })
      .mockResolvedValueOnce({
        success: true,
        sessionKey: 'SESSION-2',
        httpStatus: 200,
        responseCode: 'INS-0',
        responseDesc: 'ok',
      });

    await cache.getSessionKey();
    cache.invalidate();
    const key = await cache.getSessionKey();

    expect(key).toBe('SESSION-2');
    expect(sessionKeyService.generateSession).toHaveBeenCalledTimes(2);
  });
});
