import { ConfigService } from '@nestjs/config';

import {
  buildC2BSingleStagePath,
  buildGetSessionPath,
  isVodacomMpesaC2BConfigured,
  isVodacomMpesaConnectionConfigured,
  isVodacomMpesaPublicKeyConfigured,
  loadVodacomMpesaConnectionConfig,
} from './vodacom-mpesa-connection.config';

function fakeConfigService(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const FULL_VALUES = {
  VODACOM_MPESA_ENV: 'sandbox',
  VODACOM_MPESA_BASE_URL: 'https://openapi.m-pesa.com',
  VODACOM_MPESA_MARKET: 'vodacomTZN',
  VODACOM_MPESA_API_KEY: 'test-key',
  VODACOM_MPESA_PUBLIC_KEY: 'fake-public-key',
  VODACOM_MPESA_ORIGIN: '*',
};

describe('vodacom-mpesa-connection.config', () => {
  it('defaults to sandbox when VODACOM_MPESA_ENV is unset', () => {
    const config = loadVodacomMpesaConnectionConfig(fakeConfigService({}));
    expect(config.environment).toBe('sandbox');
  });

  it('fails closed to sandbox on an unrecognized environment value', () => {
    const config = loadVodacomMpesaConnectionConfig(
      fakeConfigService({ VODACOM_MPESA_ENV: 'PRODUCCTION' }),
    );
    expect(config.environment).toBe('sandbox');
  });

  it('enters production only on the exact value "production"', () => {
    const config = loadVodacomMpesaConnectionConfig(
      fakeConfigService({ VODACOM_MPESA_ENV: 'production' }),
    );
    expect(config.environment).toBe('production');
  });

  describe('isVodacomMpesaConnectionConfigured', () => {
    it('is false when nothing is set', () => {
      const config = loadVodacomMpesaConnectionConfig(fakeConfigService({}));
      expect(isVodacomMpesaConnectionConfigured(config)).toBe(false);
    });

    it('is false when only some required values are present (missing API key)', () => {
      const { VODACOM_MPESA_API_KEY: _omit, ...partial } = FULL_VALUES;
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(partial),
      );
      expect(isVodacomMpesaConnectionConfigured(config)).toBe(false);
    });

    it('is true once baseUrl/market/apiKey/origin are all present', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(FULL_VALUES),
      );
      expect(isVodacomMpesaConnectionConfigured(config)).toBe(true);
    });
  });

  describe('isVodacomMpesaPublicKeyConfigured', () => {
    it('is false when the public key is missing', () => {
      const { VODACOM_MPESA_PUBLIC_KEY: _omit, ...partial } = FULL_VALUES;
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(partial),
      );
      expect(isVodacomMpesaPublicKeyConfigured(config)).toBe(false);
    });

    it('is true when the public key is present', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(FULL_VALUES),
      );
      expect(isVodacomMpesaPublicKeyConfigured(config)).toBe(true);
    });
  });

  describe('buildGetSessionPath', () => {
    it('returns the documented sandbox path for the configured market', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(FULL_VALUES),
      );
      expect(buildGetSessionPath(config)).toBe(
        '/sandbox/ipg/v2/vodacomTZN/getSession/',
      );
    });

    it('throws for production — the production path is not documented for this integration', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService({ ...FULL_VALUES, VODACOM_MPESA_ENV: 'production' }),
      );
      expect(() => buildGetSessionPath(config)).toThrow(/not been documented/);
    });
  });

  describe('buildC2BSingleStagePath', () => {
    it('returns the documented sandbox C2B Single Stage path for the configured market', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(FULL_VALUES),
      );
      expect(buildC2BSingleStagePath(config)).toBe(
        '/sandbox/ipg/v2/vodacomTZN/c2bPayment/singleStage/',
      );
    });

    it('throws for production — the production path is not documented for this integration', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService({ ...FULL_VALUES, VODACOM_MPESA_ENV: 'production' }),
      );
      expect(() => buildC2BSingleStagePath(config)).toThrow(
        /not been documented/,
      );
    });
  });

  describe('isVodacomMpesaC2BConfigured', () => {
    const FULL_C2B_VALUES = {
      ...FULL_VALUES,
      VODACOM_MPESA_SERVICE_PROVIDER_CODE: '000000',
    };

    it('is false when the connection config alone is present (missing service provider code)', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(FULL_VALUES),
      );
      expect(isVodacomMpesaC2BConfigured(config)).toBe(false);
    });

    it('is false when the public key is missing', () => {
      const { VODACOM_MPESA_PUBLIC_KEY: _omit, ...partial } =
        FULL_C2B_VALUES;
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(partial),
      );
      expect(isVodacomMpesaC2BConfigured(config)).toBe(false);
    });

    it('is true once connection config, public key, and service provider code are all present', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService(FULL_C2B_VALUES),
      );
      expect(isVodacomMpesaC2BConfigured(config)).toBe(true);
    });
  });

  describe('session cache tuning', () => {
    it('defaults sessionCacheTtlSeconds and sessionCacheRefreshMarginSeconds when unset', () => {
      const config = loadVodacomMpesaConnectionConfig(fakeConfigService({}));
      expect(config.sessionCacheTtlSeconds).toBe(3000);
      expect(config.sessionCacheRefreshMarginSeconds).toBe(120);
    });

    it('reads sessionCacheTtlSeconds/sessionCacheRefreshMarginSeconds from env', () => {
      const config = loadVodacomMpesaConnectionConfig(
        fakeConfigService({
          VODACOM_MPESA_SESSION_LIFETIME_SECONDS: '600',
          VODACOM_MPESA_SESSION_REFRESH_MARGIN_SECONDS: '30',
        }),
      );
      expect(config.sessionCacheTtlSeconds).toBe(600);
      expect(config.sessionCacheRefreshMarginSeconds).toBe(30);
    });
  });
});
