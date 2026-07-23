require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { encrypt, decrypt, generateChecksum, generateEncryptionKeyFromCreds } = require('./utils/airpayCrypto');
const axios = require('axios');

const AIRPAY_MERCHANT_ID = process.env.AIRPAY_MERCHANT_ID;
const AIRPAY_CLIENT_ID = process.env.AIRPAY_CLIENT_ID;
const AIRPAY_SECRET = process.env.AIRPAY_SECRET_KEY;
const AIRPAY_USERNAME = process.env.AIRPAY_USERNAME;
const AIRPAY_PASSWORD = process.env.AIRPAY_PASSWORD;

const ALT_ENCRYPTION_KEY = (AIRPAY_USERNAME && AIRPAY_PASSWORD)
  ? generateEncryptionKeyFromCreds(AIRPAY_USERNAME, AIRPAY_PASSWORD)
  : null;

const AIRPAY_OAUTH_URL = 'https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/';

async function testOAuth() {
  console.log('--- AirPay OAuth2 Test ---');
  console.log('Merchant ID:', AIRPAY_MERCHANT_ID);
  console.log('Client ID:', AIRPAY_CLIENT_ID);
  console.log('Secret Key loaded:', AIRPAY_SECRET ? 'YES (length ' + AIRPAY_SECRET.length + ')' : 'MISSING!');
  console.log('');

  if (!AIRPAY_MERCHANT_ID || !AIRPAY_CLIENT_ID || !AIRPAY_SECRET) {
    console.log('❌ STOPPING — one or more env vars are undefined.');
    console.log('Check that your .env file is in the same folder as this script,');
    console.log('and that the variable names match exactly:');
    console.log('  AIRPAY_MERCHANT_ID, AIRPAY_CLIENT_ID, AIRPAY_SECRET_KEY');
    return;
  }

  const payload = {
    client_id: AIRPAY_CLIENT_ID,
    client_secret: AIRPAY_SECRET,
    merchant_id: AIRPAY_MERCHANT_ID,
    grant_type: 'client_credentials',
  };

  const encryptionKey = ALT_ENCRYPTION_KEY || AIRPAY_SECRET;
  console.log('Using encryption key:', encryptionKey === ALT_ENCRYPTION_KEY ? 'MD5-derived (alt)' : 'raw secret (fallback)');

  const encdata = encrypt(JSON.stringify(payload), encryptionKey);
  const checksum = generateChecksum(payload);

  console.log('Encrypted payload (encdata):', encdata);
  console.log('Checksum:', checksum);
  console.log('');

  const formBody = new URLSearchParams();
  formBody.append('merchant_id', AIRPAY_MERCHANT_ID);
  formBody.append('encdata', encdata);
  formBody.append('checksum', checksum);

  try {
    const response = await axios.post(AIRPAY_OAUTH_URL, formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('========================================');
    console.log('HTTP STATUS CODE:', response.status);
    console.log('========================================');
    console.log('--- RAW RESPONSE BODY (full) ---');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('========================================');

    if (response.data.response) {
      console.log('Found encrypted "response" field — decrypting now...');

      const rawResponseStr = response.data.response;
      console.log('Raw response string length:', rawResponseStr.length);
      console.log('First 20 chars:', rawResponseStr.substring(0, 20));
      console.log('First 16 chars (assumed IV):', rawResponseStr.substring(0, 16));
      console.log('Rest length (assumed base64 ciphertext):', rawResponseStr.length - 16);
      console.log('Rest is divisible by 4 (valid base64 length)?', (rawResponseStr.length - 16) % 4 === 0);

      try {
        const decrypted = decrypt(rawResponseStr, encryptionKey);
        console.log('');
        console.log('--- DECRYPTED RESPONSE ---');
        console.log(decrypted);
        console.log('');

        let parsed;
        try {
          parsed = JSON.parse(decrypted);
          console.log('--- PARSED JSON ---');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (parseErr) {
          console.log('⚠️  Decrypted text is NOT valid JSON.');
          console.log('Parse error:', parseErr.message);
        }

        if (parsed && (parsed.access_token || (parsed.data && parsed.data.access_token))) {
          console.log('');
          console.log('✅✅✅ SUCCESS — got access_token!');
          const tokenData = parsed.access_token ? parsed : parsed.data;
          console.log('Access token:', tokenData.access_token);
          console.log('Expires in:', tokenData.expires_in, 'seconds');
        } else if (parsed) {
          console.log('');
          console.log('❌ Decrypted successfully but no access_token found.');
          console.log('status:', parsed.status);
          console.log('message:', parsed.message);
          console.log('error_code:', parsed.error_code || parsed.response_code);
        }
      } catch (decryptErr) {
        console.log('');
        console.log('❌ DECRYPTION FAILED with key:', encryptionKey);
        console.log('Error:', decryptErr.message);
      }
    } else if (response.data.status === 'success') {
      console.log('');
      console.log('✅ SUCCESS — credentials and encryption are correct!');
      const tokenData = response.data.data;
      console.log('Access token:', tokenData?.access_token);
      console.log('Expires in:', tokenData?.expires_in, 'seconds');
    } else {
      console.log('');
      console.log('❌ FAILED — full data object above shows the real reason.');
      console.log('status_code:', response.data.status_code);
      console.log('response_code:', response.data.response_code);
      console.log('message:', response.data.message);
      console.log('error_code:', response.data.error_code);
    }
  } catch (err) {
    console.log('');
    console.log('========================================');
    console.log('❌ REQUEST THREW AN ERROR (network/HTTP level)');
    console.log('========================================');
    console.log('err.message:', err.message);
    console.log('err.code:', err.code);
    if (err.response) {
      console.log('HTTP status:', err.response.status);
      console.log('Response headers:', JSON.stringify(err.response.headers, null, 2));
      console.log('Response body:', JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
      console.log('No response received at all (request was made, no reply).');
      console.log('This usually means: wrong URL, network/firewall block, or DNS issue.');
    } else {
      console.log('Error happened before the request was even sent.');
      console.log('Full error object:', err);
    }
  }
}

testOAuth();
