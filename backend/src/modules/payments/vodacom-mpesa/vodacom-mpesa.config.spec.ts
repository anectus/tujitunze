import { ConfigService } from '@nestjs/config';

import {
  isVodacomMpesaConfigured,
  loadVodacomMpesaConfig,
} from './vodacom-mpesa.config';

function fakeConfigService(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('VodacomMpesaConfig', () => {
  it('defaults to sandbox when VODACOM_MPESA_ENV is unset', () => {
    const config = loadVodacomMpesaConfig(fakeConfigService({}));
    expect(config.environment).toBe('sandbox');
  });

  it('never enters production on an unrecognized/misspelled env value — fails closed to sandbox', () => {
    const config = loadVodacomMpesaConfig(
      fakeConfigService({ VODACOM_MPESA_ENV: 'PRODUCCTION' }),
    );
    expect(config.environment).toBe('sandbox');
  });

  it('enters production only on the exact value "production"', () => {
    const config = loadVodacomMpesaConfig(
      fakeConfigService({ VODACOM_MPESA_ENV: 'production' }),
    );
    expect(config.environment).toBe('production');
  });

  it('is case-insensitive and trims whitespace for the environment value', () => {
    const config = loadVodacomMpesaConfig(
      fakeConfigService({ VODACOM_MPESA_ENV: '  Production  ' }),
    );
    expect(config.environment).toBe('production');
  });

  it('applies sane numeric defaults when tuning values are unset', () => {
    const config = loadVodacomMpesaConfig(fakeConfigService({}));
    expect(config.sessionLifetimeSeconds).toBeGreaterThan(0);
    expect(config.sessionRefreshMarginSeconds).toBeGreaterThan(0);
    expect(config.timeoutMs).toBeGreaterThan(0);
    expect(config.maxRetries).toBeGreaterThan(0);
  });

  it('ignores a non-numeric override and falls back to the default', () => {
    const config = loadVodacomMpesaConfig(
      fakeConfigService({ VODACOM_MPESA_TIMEOUT_MS: 'not-a-number' }),
    );
    expect(config.timeoutMs).toBeGreaterThan(0);
  });

  it('respects a valid numeric override', () => {
    const config = loadVodacomMpesaConfig(
      fakeConfigService({ VODACOM_MPESA_TIMEOUT_MS: '5000' }),
    );
    expect(config.timeoutMs).toBe(5000);
  });

  describe('isVodacomMpesaConfigured', () => {
    it('is false when any required credential/endpoint value is missing', () => {
      const config = loadVodacomMpesaConfig(fakeConfigService({}));
      expect(isVodacomMpesaConfigured(config)).toBe(false);
    });

    it('is false when only some required values are present', () => {
      const config = loadVodacomMpesaConfig(
        fakeConfigService({
          VODACOM_MPESA_API_BASE_URL: 'https://sandbox.example.com',
          VODACOM_MPESA_API_KEY: 'key',
        }),
      );
      expect(isVodacomMpesaConfigured(config)).toBe(false);
    });

    it('is true only once every required value is present', () => {
      const config = loadVodacomMpesaConfig(
        fakeConfigService({
          VODACOM_MPESA_API_BASE_URL: 'https://sandbox.example.com',
          VODACOM_MPESA_API_KEY: 'key',
          VODACOM_MPESA_APPLICATION_ID: 'app-1',
          VODACOM_MPESA_SESSION_PATH: '/session',
        }),
      );
      expect(isVodacomMpesaConfigured(config)).toBe(true);
    });
  });
});
