import crypto from 'crypto';
import { config } from '../config/env.js';

/**
 * ============================================================================
 * SHREEJI MILITARY-GRADE AES-256-GCM CRYPTOGRAPHIC DATA ENGINE
 * Protects database records, customer inquiries, phone numbers & dispatches
 * Zero cost, built on Node.js native hardware-accelerated AES-NI crypto
 * ============================================================================
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCRYPTION_VERSION = 'v1';

// Derive or load master 256-bit encryption key
function getMasterKey() {
  const envKey = process.env.ENCRYPTION_KEY || config.jwtSecret;
  if (!envKey) {
    throw new Error('[Security] No master encryption key or JWT secret configured.');
  }
  // If 64 hex chars, parse as buffer; otherwise derive 32-byte key via SHA-256
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM authenticated encryption
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted string: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptField(text) {
  if (text === null || text === undefined || text === '') return text;
  if (typeof text !== 'string') text = String(text);

  // Avoid double-encryption if already formatted as enc:v1:...
  if (text.startsWith(`enc:${ENCRYPTION_VERSION}:`)) return text;

  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `enc:${ENCRYPTION_VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted field
 * @param {string} encryptedText - Encrypted string format
 * @returns {string} Original plaintext, or original value if not encrypted
 */
export function decryptField(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;

  const prefix = `enc:${ENCRYPTION_VERSION}:`;
  if (!encryptedText.startsWith(prefix)) return encryptedText;

  try {
    const parts = encryptedText.substring(prefix.length).split(':');
    if (parts.length !== 3) return encryptedText;

    const [ivHex, tagHex, cipherHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption or authentication tag fails (tampered data), log and return masked value
    console.error('[Security:DecryptionError] Integrity check failed or invalid key:', err.message);
    return '[TAMPERED_OR_CORRUPT_DATA]';
  }
}

/**
 * Generate a deterministic HMAC-SHA256 blind index for searching
 * Enables fast lookups (e.g. searching customer by phone) without storing raw plaintext
 * @param {string} value - Text to index
 * @returns {string} 64-character hex hash
 */
export function generateBlindIndex(value) {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = getMasterKey();
  return crypto.createHmac('sha256', key).update(normalized).digest('hex');
}

/**
 * Encrypt specific sensitive fields of an object
 * @param {object} obj - The record to encrypt
 * @param {string[]} sensitiveKeys - Keys to encrypt (e.g. ['phone', 'email', 'notes'])
 * @returns {object} Shallow copy with encrypted fields
 */
export function encryptRecord(obj, sensitiveKeys = ['phone', 'email', 'phoneNumber', 'notes', 'dispatch_url', 'dispatchUrl']) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  for (const k of sensitiveKeys) {
    if (clone[k]) {
      clone[k] = encryptField(clone[k]);
    }
  }
  return clone;
}

/**
 * Decrypt specific sensitive fields of an object
 * @param {object} obj - The record to decrypt
 * @param {string[]} sensitiveKeys - Keys to decrypt
 * @returns {object} Shallow copy with decrypted fields
 */
export function decryptRecord(obj, sensitiveKeys = ['phone', 'email', 'phoneNumber', 'notes', 'dispatch_url', 'dispatchUrl']) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  for (const k of sensitiveKeys) {
    if (clone[k]) {
      clone[k] = decryptField(clone[k]);
    }
  }
  return clone;
}

export default {
  encryptField,
  decryptField,
  generateBlindIndex,
  encryptRecord,
  decryptRecord
};
