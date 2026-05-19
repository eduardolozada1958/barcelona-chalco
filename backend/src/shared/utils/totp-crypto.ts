import crypto from 'crypto';
import { env } from '@config/env';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function encryptionKey(): Buffer {
  return crypto.createHash('sha256').update(`totp:${env.JWT_SECRET}`).digest();
}

/** Cifra el secreto TOTP antes de guardarlo en BD. */
export function encryptTotpSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

/** Descifra el secreto TOTP desde BD. */
export function decryptTotpSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);
  const decipher = crypto.createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
