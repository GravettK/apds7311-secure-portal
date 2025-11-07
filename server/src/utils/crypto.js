const crypto = require('crypto');

// Use DATA_KEY_HEX from env. If missing in development, provide a safe fallback
const DEV_FALLBACK_KEY = '0000000000000000000000000000000000000000000000000000000000000000';
const KEY_HEX = process.env.DATA_KEY_HEX || (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_KEY : '');
if (KEY_HEX.length !== 64) {
  console.warn('DATA_KEY_HEX missing or invalid length; encryption will fail');
  // KEY will be an empty buffer in production if missing; in dev we already fall back to zeros
}
const KEY = Buffer.from(KEY_HEX, 'hex'); // 32 bytes

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]); // store as VARBINARY
}

module.exports = { encrypt };
