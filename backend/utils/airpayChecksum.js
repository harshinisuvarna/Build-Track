const crypto = require('crypto');

function generateChecksum(secretKey, fields) {
  const dataString = fields.join('|');
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataString);
  return hmac.digest('hex');
}

module.exports = { generateChecksum };