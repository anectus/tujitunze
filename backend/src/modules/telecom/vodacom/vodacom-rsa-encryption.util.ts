import * as crypto from 'crypto';

// Real Vodacom M-Pesa OpenAPI session authentication: the API Key must
// be RSA-encrypted with the platform's public key before being placed
// in the Authorization Bearer header — per the official documentation
// provided for this integration. Never send the raw API Key.
//
// ASSUMPTION FLAGGED FOR VERIFICATION: the provided documentation states
// the API Key "must be encrypted using the platform public RSA key"
// but does not specify the RSA padding scheme. This implementation uses
// PKCS#1 v1.5 padding (crypto.constants.RSA_PKCS1_PADDING) — the
// convention most commonly documented across M-Pesa OpenAPI
// integrations of this family. If the real sandbox rejects a session
// request with an authentication-specific error (as opposed to a
// missing-header or malformed-request error), this padding constant is
// the first thing to change to RSA_PKCS1_OAEP_PADDING and re-test —
// both are supported by Node's crypto module against this key without
// error, so a wrong choice will surface as a Vodacom-side rejection,
// not a local exception.
const RSA_PADDING = crypto.constants.RSA_PKCS1_PADDING;

export class VodacomPublicKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VodacomPublicKeyError';
  }
}

// Accepts the public key either as a full PEM block (with
// -----BEGIN/END PUBLIC KEY----- markers) or as the bare base64 SPKI
// DER blob exactly as it appears on the Vodacom developer portal (no
// markers, no line wrapping) — the exact form supplied for this
// integration. Never logs the key material itself in any error path.
function parsePublicKey(publicKeyValue: string): crypto.KeyObject {
  const trimmed = publicKeyValue.trim();

  try {
    if (trimmed.includes('-----BEGIN')) {
      return crypto.createPublicKey(trimmed);
    }

    return crypto.createPublicKey({
      key: Buffer.from(trimmed, 'base64'),
      format: 'der',
      type: 'spki',
    });
  } catch (error) {
    throw new VodacomPublicKeyError(
      `Vodacom M-Pesa public key is malformed and could not be parsed: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  }
}

// Encrypts the raw API Key with Vodacom's platform public key and
// returns it base64-encoded, ready to place directly after "Bearer " in
// the Authorization header. Throws VodacomPublicKeyError (never the raw
// underlying crypto error, which could otherwise be logged/surfaced
// with key material embedded) if the public key cannot be parsed, and
// a plain Error if the plaintext exceeds what this key size can encrypt
// in one block (RSA has no chunking — a correctly-issued API Key is
// always well within this key's capacity).
export function encryptApiKeyForVodacom(
  apiKey: string,
  publicKeyValue: string,
): string {
  const keyObject = parsePublicKey(publicKeyValue);

  try {
    const encrypted = crypto.publicEncrypt(
      { key: keyObject, padding: RSA_PADDING },
      Buffer.from(apiKey, 'utf8'),
    );
    return encrypted.toString('base64');
  } catch {
    // Never include `apiKey` or the underlying error (which can embed
    // the plaintext buffer for some OpenSSL error paths) in the thrown
    // message.
    throw new Error(
      'Vodacom M-Pesa API Key could not be RSA-encrypted with the configured public key.',
    );
  }
}
