import * as crypto from 'crypto';

import {
  encryptApiKeyForVodacom,
  VodacomPublicKeyError,
} from './vodacom-rsa-encryption.util';

// The exact platform public key supplied in the official documentation
// for this integration (bare base64 SPKI DER, no PEM markers) — used
// here only to prove the encryption mechanics work against the real
// key shape, never to make a real network call.
const REAL_PUBLIC_KEY_BASE64 =
  'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArv9yxA69XQKBo24BaF/D+fvlqmGdYjqLQ5WtNBb5tquqGvAvG3WMFETVUSow/LizQalxj2ElMVrUmzu5mGGkxK08bWEXF7a1DEvtVJs6nppIlFJc2SnrU14AOrIrB28ogm58JjAl5BOQawOXD5dfSk7MaAA82pVHoIqEu0FxA8BOKU+RGTihRU+ptw1j4bsAJYiPbSX6i71gfPvwHPYamM0bfI4CmlsUUR3KvCG24rB6FNPcRBhM3jDuv8ae2kC33w9hEq8qNB55uw51vK7hyXoAa+U7IqP1y6nBdlN25gkxEA8yrsl1678cspeXr+3ciRyqoRgj9RD/ONbJhhxFvt1cLBh+qwK2eqISfBb06eRnNeC71oBokDm3zyCnkOtMDGl7IvnMfZfEPFCfg5QgJVk1msPpRvQxmEsrX9MQRyFVzgy2CWNIb7c+jPapyrNwoUbANlN8adU1m6yOuoX7F49x+OjiG2se0EJ6nafeKUXw/+hiJZvELUYgzKUtMAZVTNZfT8jjb58j8GVtuS+6TM2AutbejaCV84ZK58E2CRJqhmjQibEUO6KPdD7oTlEkFy52Y1uOOBXgYpqMzufNPmfdqqqSM4dU70PO8ogyKGiLAIxCetMjjm6FCMEA3Kc8K0Ig7/XtFm9By6VxTJK1Mg36TlHaZKP6VzVLXMtesJECAwEAAQ==';

function toPem(base64: string): string {
  const lines = base64.match(/.{1,64}/g) ?? [base64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

describe('encryptApiKeyForVodacom', () => {
  it('encrypts an API key against the real bare base64 SPKI key (no PEM markers)', () => {
    const result = encryptApiKeyForVodacom(
      'my-test-api-key',
      REAL_PUBLIC_KEY_BASE64,
    );
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Base64 output.
    expect(() => Buffer.from(result, 'base64')).not.toThrow();
  });

  it('encrypts an API key against the same key wrapped in full PEM markers', () => {
    const result = encryptApiKeyForVodacom(
      'my-test-api-key',
      toPem(REAL_PUBLIC_KEY_BASE64),
    );
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a value decryptable by the matching private key (round-trip correctness)', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const publicKeyPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    const encrypted = encryptApiKeyForVodacom(
      'round-trip-key-123',
      publicKeyPem,
    );

    const decrypted = crypto.privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(encrypted, 'base64'),
    );
    expect(decrypted.toString('utf8')).toBe('round-trip-key-123');
  });

  it('produces different ciphertext for different API keys', () => {
    const a = encryptApiKeyForVodacom('key-a', REAL_PUBLIC_KEY_BASE64);
    const b = encryptApiKeyForVodacom('key-b', REAL_PUBLIC_KEY_BASE64);
    expect(a).not.toBe(b);
  });

  it('malformed public key: throws VodacomPublicKeyError, not a raw crypto exception', () => {
    expect(() =>
      encryptApiKeyForVodacom('any-key', 'not-a-valid-key-at-all'),
    ).toThrow(VodacomPublicKeyError);
  });

  it('malformed public key: the error message never contains the API key', () => {
    try {
      encryptApiKeyForVodacom('super-secret-api-key-value', 'garbage');
      fail('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(VodacomPublicKeyError);
      expect((error as Error).message).not.toContain(
        'super-secret-api-key-value',
      );
    }
  });

  it('empty public key: throws VodacomPublicKeyError', () => {
    expect(() => encryptApiKeyForVodacom('any-key', '')).toThrow(
      VodacomPublicKeyError,
    );
  });
});
