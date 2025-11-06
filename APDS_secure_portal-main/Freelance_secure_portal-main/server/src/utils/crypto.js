const crypto = require('crypto');

const KEY_HEX = process.env.DATA_KEY_HEX || '';
if (KEY_HEX.length !== 64) {
  console.warn('DATA_KEY_HEX missing or invalid length; encryption will fail');
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
