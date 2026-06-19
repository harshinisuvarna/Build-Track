// ============================================================================
// AirPay v4 cryptography utilities
//
// CONFIRMED via live OAuth2 test against AirPay sandbox:
//   - encrypt() / decrypt() must be called with the MD5-derived key:
//       md5(username + "~:~" + password)
//     NOT the raw secretKey, even though the OAuth2 PHP sample implies the
//     raw secret should work. airpayService.js now uses this key
//     consistently for every encrypt/decrypt call (OAuth2, payment payload,
//     and callback).
//   - generatePrivateKey() and generateChecksum() are separate formulas,
//     unrelated to the AES key above. They have NOT yet been confirmed
//     against a live payment request — only the OAuth2 step has been
//     tested so far. Use test_airpay_payment.js to validate those next.
//
// Docs:
//   - Encryption: https://docs.airpay.co.in/v4/getting-started-guide/encryption/
//   - Decryption: https://docs.airpay.co.in/v4/getting-started-guide/decryption/
//   - Checksum:   https://docs.airpay.co.in/v4/getting-started-guide/checksum/
//   - privatekey: from the Simple Transaction PHP sample
// ============================================================================
const crypto = require('crypto');

/**
 * ENCRYPTION (AES-256-CBC)
 * Used for: OAuth2 request, payment request (encdata field), reading callback
 *
 * Per docs:
 *   $iv = bin2hex(openssl_random_pseudo_bytes(8));   // 8 random bytes -> 16 hex chars
 *   $raw = openssl_encrypt($data, 'AES-256-CBC', $encryptionkey, OPENSSL_RAW_DATA, $iv);
 *   $encryptedata = $iv . base64_encode($raw);
 *
 * IMPORTANT: PHP's openssl_encrypt with a string IV like "abcdef0123456789"
 * (16 hex CHARACTERS, not 16 raw bytes) uses those 16 ASCII characters
 * directly as the 16-byte IV buffer. We replicate that exactly below.
 */
function encrypt(plainText, encryptionKey) {
  // 8 random bytes -> hex string is 16 characters long. This 16-char string
  // IS the IV buffer used by AES-256-CBC (which needs a 16-byte IV).
  const ivHexString = crypto.randomBytes(8).toString('hex'); // 16 chars
  const ivBuffer = Buffer.from(ivHexString, 'utf8'); // 16 bytes, ASCII of the hex chars

  // AES-256-CBC requires a 32-byte key. The MD5-derived key is already
  // exactly 32 hex characters (= 32 bytes as utf8), so this pad/truncate
  // is mostly a safety net for any other key that's a different length.
  const keyBuffer = Buffer.alloc(32);
  Buffer.from(encryptionKey, 'utf8').copy(keyBuffer);

  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  cipher.setAutoPadding(true); // PKCS5/PKCS7 padding (same thing for AES block size)

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  // Final encrypted string = ivHexString + base64(rawCipherBytes)
  return ivHexString + encrypted.toString('base64');
}

/**
 * DECRYPTION (AES-256-CBC) — reverse of encrypt()
 * Used for: reading AirPay's OAuth2 response and payment callback response
 *
 * AirPay's encrypted string = first 16 chars (IV) + rest (base64 ciphertext)
 */
function decrypt(encryptedString, encryptionKey) {
  const ivHexString = encryptedString.substring(0, 16);
  const base64Cipher = encryptedString.substring(16);

  const ivBuffer = Buffer.from(ivHexString, 'utf8');
  const keyBuffer = Buffer.alloc(32);
  Buffer.from(encryptionKey, 'utf8').copy(keyBuffer);

  const cipherBytes = Buffer.from(base64Cipher, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  decipher.setAutoPadding(true);

  const decrypted = Buffer.concat([
    decipher.update(cipherBytes),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * CHECKSUM (SHA-256)
 * Per docs exactly:
 *   1. Sort all key-value pairs alphabetically by key
 *   2. Concatenate just the VALUES (no separators) in that sorted order
 *   3. Append today's date in YYYY-MM-DD format
 *   4. SHA-256 hash the result
 *
 * @param {Object} data - plain object of fields (NOT including checksum itself)
 */
function generateChecksum(data) {
  const sortedKeys = Object.keys(data).sort();
  let concatenated = '';
  for (const key of sortedKeys) {
    concatenated += data[key];
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  return crypto
    .createHash('sha256')
    .update(concatenated + dateStr)
    .digest('hex');
}

/**
 * PRIVATEKEY
 * Per Simple Transaction PHP sample:
 *   $privatekey = hash('sha256', $secret.'@'.$username.':|:'.$password);
 *
 * NOT YET CONFIRMED against a live payment request — OAuth2 doesn't use
 * this field at all, so a successful OAuth2 test tells us nothing about
 * whether this formula is right. This is the next thing to verify.
 */
function generatePrivateKey(secret, username, password) {
  return crypto
    .createHash('sha256')
    .update(`${secret}@${username}:|:${password}`)
    .digest('hex');
}

/**
 * ENCRYPTION KEY (derived) — CONFIRMED correct, used for every AES
 * encrypt/decrypt call across OAuth2, payment payload, and callback:
 *   md5(username . "~:~" . password)
 */
function generateEncryptionKeyFromCreds(username, password) {
  return crypto
    .createHash('md5')
    .update(`${username}~:~${password}`)
    .digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateChecksum,
  generatePrivateKey,
  generateEncryptionKeyFromCreds,
};