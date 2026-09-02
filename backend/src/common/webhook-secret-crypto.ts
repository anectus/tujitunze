import * as crypto from 'crypto';

// AES-256-GCM at rest for telecom_operators.webhook_secret /
// banks.webhook_secret — these have to be stored in a form HSIMS can
// read back (unlike api_key_hash/passwords, which are one-way bcrypt
// hashes), because the corresponding *WebhookSignatureGuard reads the
// secret on every inbound webhook call to verify the HMAC-SHA256
// signature. No insecure fallback key — same "fail closed, don't
// default" rule this project already applies to DB_PASSWORD.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

function getKey(): Buffer {
  const hex = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;

  if (!hex) {
    throw new Error(
      'WEBHOOK_SECRET_ENCRYPTION_KEY is not configured — refusing to store or read a webhook secret without it.',
    );
  }

  const key = Buffer.from(hex, 'hex');

  if (key.length !== 32) {
    throw new Error(
      'WEBHOOK_SECRET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).',
    );
  }

  return key;
}

// Stored shape: "<iv>:<authTag>:<ciphertext>", each hex-encoded.
export function encryptWebhookSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptWebhookSecret(stored: string): string {
  const parts = stored.split(':');

  if (parts.length !== 3) {
    throw new Error(
      'Stored webhook secret is not in the expected encrypted format.',
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const plainText = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);

  return plainText.toString('utf8');
}
