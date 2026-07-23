const crypto = require('crypto');

function encryptChecksum(data, salt) {
  return crypto.createHash('sha256').update(`${salt}@${data}`).digest('hex');
}

function generatePrivateKey(secret, username, password) {
  const udata = `${username}:|:${password}`;
  return encryptChecksum(udata, secret);
}

function checksumcal(postData) {
  const sortedData = {};
  Object.keys(postData).sort().forEach((key) => {
    sortedData[key] = postData[key];
  });

  let data = '';
  for (const value of Object.values(sortedData)) {
    data += value;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const fullString = data + dateStr;

  return {
    checksum: crypto.createHash('sha256').update(fullString).digest('hex'),
    debugString: fullString,
  };
}

function generateChecksum(postData) {
  return checksumcal(postData).checksum;
}

function generateEncryptionKeyFromCreds(username, password) {
  return crypto.createHash('md5').update(`${username}~:~${password}`).digest('hex');
}

function encrypt(plainText, secretKey) {
  const ivHex = crypto.randomBytes(8).toString('hex');
  const ivBuffer = Buffer.from(ivHex);

  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), ivBuffer);
  const raw = Buffer.concat([cipher.update(plainText, 'utf-8'), cipher.final()]);
  return ivHex + raw.toString('base64');
}

function decrypt(responsedata, secretKey) {
  const data = responsedata;
  const ivHex = data.substring(0, 16);
  const iv = Buffer.from(ivHex);
  const encryptedData = Buffer.from(data.slice(16), 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), iv);
  let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
  decrypted += decipher.final();
  return decrypted;
}

module.exports = {
  encryptChecksum,
  generatePrivateKey,
  checksumcal,
  generateChecksum,
  generateEncryptionKeyFromCreds,
  encrypt,
  decrypt,
};
