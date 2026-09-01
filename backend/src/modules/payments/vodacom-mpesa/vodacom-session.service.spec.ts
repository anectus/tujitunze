import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { VodacomSessionService } from './vodacom-session.service';
import { MPESA_API_CLIENT, MpesaApiClient } from './vodacom-mpesa.types';

function fakeConfigService(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('VodacomSessionService', () => {
  let service: VodacomSessionService;
  let generateSession: jest.Mock;

  const buildService = async (configValues: Record<string, string> = {}) => {
    generateSession = jest.fn();
    const fakeClient: Partial<MpesaApiClient> = { generateSession };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VodacomSessionService,
        { provide: MPESA_API_CLIENT, useValue: fakeClient },
        { provide: ConfigService, useValue: fakeConfigService(configValues) },
      ],
    }).compile();

    service = module.get(VodacomSessionService);
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('successful session generation: calls the client once and returns its session key', async () => {
    await buildService();
    generateSession.mockResolvedValue({
      sessionKey: 'session-abc',
      expiresAt: new Date('2026-01-01T01:00:00.000Z'),
    });

    const key = await service.getSessionKey();

    expect(key).toBe('session-abc');
    expect(generateSession).toHaveBeenCalledTimes(1);
  });

  it('caches the session key and does not call the client again while it remains valid', async () => {
    await buildService();
    generateSession.mockResolvedValue({
      sessionKey: 'session-abc',
      expiresAt: new Date('2026-01-01T01:00:00.000Z'),
    });

    await service.getSessionKey();
    await service.getSessionKey();
    await service.getSessionKey();

    expect(generateSession).toHaveBeenCalledTimes(1);
  });

  it('session renewal: refreshes proactively once inside the configured refresh margin, before actual expiry', async () => {
    await buildService({
      VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS: '120',
    });
    generateSession
      .mockResolvedValueOnce({
        sessionKey: 'session-1',
        expiresAt: new Date('2026-01-01T00:05:00.000Z'), // 5 min lifetime
      })
      .mockResolvedValueOnce({
        sessionKey: 'session-2',
        expiresAt: new Date('2026-01-01T00:10:00.000Z'),
      });

    const first = await service.getSessionKey();
    expect(first).toBe('session-1');

    // 2:00 in — 3 minutes remain before the 5:00 expiry, still outside
    // the 2-minute refresh margin, so the cached key must be returned.
    jest.setSystemTime(new Date('2026-01-01T00:02:00.000Z'));
    const stillCached = await service.getSessionKey();
    expect(stillCached).toBe('session-1');
    expect(generateSession).toHaveBeenCalledTimes(1);

    // 3:30 in — only 1:30 remains before the 5:00 expiry, inside the
    // 2-minute margin, must trigger a real renewal.
    jest.setSystemTime(new Date('2026-01-01T00:03:30.000Z'));
    const renewed = await service.getSessionKey();
    expect(renewed).toBe('session-2');
    expect(generateSession).toHaveBeenCalledTimes(2);
  });

  it('expired session: a fully expired cached session is never returned — a fresh one is fetched', async () => {
    await buildService();
    generateSession
      .mockResolvedValueOnce({
        sessionKey: 'session-1',
        expiresAt: new Date('2026-01-01T00:05:00.000Z'),
      })
      .mockResolvedValueOnce({
        sessionKey: 'session-2',
        expiresAt: new Date('2026-01-01T00:10:00.000Z'),
      });

    await service.getSessionKey();
    jest.setSystemTime(new Date('2026-01-01T00:06:00.000Z')); // past expiry
    const key = await service.getSessionKey();

    expect(key).toBe('session-2');
    expect(generateSession).toHaveBeenCalledTimes(2);
  });

  it('failed authentication: propagates the client error and does not cache anything', async () => {
    await buildService();
    generateSession.mockRejectedValue(new Error('invalid API key'));

    await expect(service.getSessionKey()).rejects.toThrow('invalid API key');

    generateSession.mockResolvedValue({
      sessionKey: 'session-after-fix',
      expiresAt: new Date('2026-01-01T01:00:00.000Z'),
    });
    const key = await service.getSessionKey();
    expect(key).toBe('session-after-fix');
    expect(generateSession).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates concurrent callers into a single generateSession() call', async () => {
    await buildService();
    let resolveGenerate!: (value: {
      sessionKey: string;
      expiresAt: Date;
    }) => void;
    generateSession.mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      }),
    );

    const call1 = service.getSessionKey();
    const call2 = service.getSessionKey();
    const call3 = service.getSessionKey();

    resolveGenerate({
      sessionKey: 'session-concurrent',
      expiresAt: new Date('2026-01-01T01:00:00.000Z'),
    });

    const [r1, r2, r3] = await Promise.all([call1, call2, call3]);
    expect(r1).toBe('session-concurrent');
    expect(r2).toBe('session-concurrent');
    expect(r3).toBe('session-concurrent');
    expect(generateSession).toHaveBeenCalledTimes(1);
  });

  it('invalidate() forces the next call to fetch a fresh session even though the cached one has not expired', async () => {
    await buildService();
    generateSession
      .mockResolvedValueOnce({
        sessionKey: 'session-1',
        expiresAt: new Date('2026-01-01T01:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        sessionKey: 'session-2',
        expiresAt: new Date('2026-01-01T02:00:00.000Z'),
      });

    await service.getSessionKey();
    service.invalidate();
    const key = await service.getSessionKey();

    expect(key).toBe('session-2');
    expect(generateSession).toHaveBeenCalledTimes(2);
  });
});
