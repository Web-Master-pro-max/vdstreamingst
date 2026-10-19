const crypto = require('crypto');

const STREAM_SECRET = crypto.createHash('sha256').update(
  process.env.STREAM_SECRET || process.env.JWT_SECRET || 'infinx_stealth_stream_secret_9981'
).digest();

/**
 * AES-256-GCM Stream Token Encryption
 * Completely hides upstream URLs, referers, and providers from client network inspection.
 */
function encryptStreamToken(obj) {
  try {
    const jsonStr = JSON.stringify(obj);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', STREAM_SECRET, iv);
    let enc = cipher.update(jsonStr, 'utf8', 'base64url');
    enc += cipher.final('base64url');
    const authTag = cipher.getAuthTag().toString('base64url');
    return `${iv.toString('base64url')}.${authTag}.${enc}`;
  } catch (err) {
    console.error('[StreamSecurity] Encrypt error:', err);
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
}

/**
 * Decrypts AES-256-GCM Stream Token
 */
function decryptStreamToken(tokenStr) {
  try {
    if (!tokenStr || typeof tokenStr !== 'string') return null;
    const parts = tokenStr.split('.');
    if (parts.length === 3) {
      const iv = Buffer.from(parts[0], 'base64url');
      const authTag = Buffer.from(parts[1], 'base64url');
      const enc = parts[2];
      const decipher = crypto.createDecipheriv('aes-256-gcm', STREAM_SECRET, iv);
      decipher.setAuthTag(authTag);
      let dec = decipher.update(enc, 'base64url', 'utf8');
      dec += decipher.final('utf8');
      return JSON.parse(dec);
    }
    const plain = Buffer.from(tokenStr, 'base64url').toString('utf8');
    return JSON.parse(plain);
  } catch (err) {
    return null;
  }
}

module.exports = {
  encryptStreamToken,
  decryptStreamToken
};
