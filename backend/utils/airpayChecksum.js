// Node.js built-in crypto — no npm install needed
const crypto = require('crypto');

/**
 * AirPay checksum formula:
 * HMAC-SHA256 of the pipe-separated fields
 * using your AirPay secret key
 */
function generateChecksum(secretKey, fields) {
  const dataString = fields.join('|');
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataString);
  return hmac.digest('hex');
}

module.exports = { generateChecksum };