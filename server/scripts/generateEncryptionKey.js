import crypto from 'crypto';

/**
 * ============================================================================
 * SHREEJI AES-256 ENCRYPTION KEY GENERATOR
 * Generates cryptographically secure 256-bit hexadecimal keys for .env
 * ============================================================================
 */

const keyHex = crypto.randomBytes(32).toString('hex');
console.log('\n🔐 ====================================================');
console.log('SHREEJI MILITARY-GRADE AES-256 MASTER KEY GENERATED');
console.log('====================================================');
console.log(`\nENCRYPTION_KEY=${keyHex}\n`);
console.log('Paste this key into your server/.env file.');
console.log('Never commit this key or your .env file into Git repository.\n');
