require('dotenv').config();
const { decrypt, generateEncryptionKeyFromCreds } = require('./utils/airpayCrypto');

const RAW_RESPONSE = '0a97f1b4a18051fffwve8EEw2vtVVUyxHyIvy4qRq2LQlO\/ZNkxicL52979EjVswW\/ZC2SMebKqydIsB\/vISpQFMufCsWWO2g4fPRp9k7eNiuhl9lp3mh2Kxtn\/aCYZgOYj2Q7d7uzC7OJiZNeheB3wD1VrB9\/vjG5Fw\/2s9fYff7J8Z\/uug4FfyFtQ=';

function main() {
  const username = process.env.AIRPAY_USERNAME;
  const password = process.env.AIRPAY_PASSWORD;

  if (!username || !password) {
    console.log('❌ Missing AIRPAY_USERNAME / AIRPAY_PASSWORD in .env');
    return;
  }

  if (RAW_RESPONSE === 'PASTE_THE_FULL_RESPONSE_VALUE_HERE') {
    console.log('❌ Paste the actual response value into RAW_RESPONSE first.');
    return;
  }

  const key = generateEncryptionKeyFromCreds(username, password);

  try {
    const decrypted = decrypt(RAW_RESPONSE, key);
    console.log('--- DECRYPTED RAW TEXT ---');
    console.log(decrypted);
    console.log('');

    try {
      const parsed = JSON.parse(decrypted);
      console.log('--- PARSED JSON ---');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('(Decrypted text is not valid JSON — see raw text above)');
    }
  } catch (err) {
    console.log('❌ DECRYPTION FAILED:', err.message);
    console.log('This usually means the response string got truncated or');
    console.log('modified when copying it — make sure you copied it in full.');
  }
}

main();
