const axios = require('axios');
const {
  encrypt,
  decrypt,
  generateChecksum,
  generatePrivateKey,
  generateEncryptionKeyFromCreds,
} = require('./airpayCrypto');

function getConfig() {
  const cfg = {
    merchantId: (process.env.AIRPAY_MERCHANT_ID || '').trim(),
    clientId:   (process.env.AIRPAY_CLIENT_ID   || '').trim(),
    secret:     (process.env.AIRPAY_SECRET_KEY   || '').trim(),
    username:   (process.env.AIRPAY_USERNAME     || '').trim(),
    password:   (process.env.AIRPAY_PASSWORD     || '').trim(),
  };
  const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `AirPay config missing: ${missing.join(', ')} — ` +
      `check AIRPAY_MERCHANT_ID, AIRPAY_CLIENT_ID, AIRPAY_SECRET_KEY, ` +
      `AIRPAY_USERNAME, AIRPAY_PASSWORD in your .env`
    );
  }
  return cfg;
}

const AIRPAY_OAUTH_URL        = 'https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/';
const AIRPAY_PAYMENT_BASE_URL = 'https://payments.airpay.co.in/pay/v4/';

let cachedToken    = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const cfg           = getConfig();
  const encryptionKey = generateEncryptionKeyFromCreds(cfg.username, cfg.password);

  const payload = {
    client_id:     cfg.clientId,
    client_secret: cfg.secret,
    grant_type:    'client_credentials',
    merchant_id:   cfg.merchantId,
  };

  const encdata  = encrypt(JSON.stringify(payload), encryptionKey);
  const checksum = generateChecksum(payload);

  const formBody = new URLSearchParams();
  formBody.append('merchant_id', cfg.merchantId);
  formBody.append('encdata',     encdata);
  formBody.append('checksum',    checksum);

  const response = await axios.post(AIRPAY_OAUTH_URL, formBody, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!response.data.response) {
    throw new Error('AirPay OAuth2: no "response" field in reply');
  }

  const decrypted = decrypt(response.data.response, encryptionKey);
  const result    = JSON.parse(decrypted);

  if (result.status !== 'success' || !result.data?.access_token) {
    throw new Error(
      `AirPay OAuth2 failed: ${result.message || 'unknown'} ` +
      `(code: ${result.response_code || result.error_code})`
    );
  }

  cachedToken    = result.data.access_token;
  tokenExpiresAt = now + (result.data.expires_in || 300) * 1000 - 20000;
  return cachedToken;
}

async function buildPaymentPayload({
  orderId,
  amount,
  buyerEmail,
  buyerPhone,
  buyerFirstName,
  buyerLastName,
  returnUrl,

}) {
  const cfg             = getConfig();
  const encryptionKey   = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
  const accessToken     = await getAccessToken();
  const amountFormatted = Number(amount).toFixed(2);

  const privatekey = generatePrivateKey(process.env.AIRPAY_API_KEY || cfg.secret, cfg.username, cfg.password);

  const transactionData = {
    orderid:         orderId,
    amount:           amountFormatted,
    currency_code:   '356',
    iso_currency:    'INR',
    buyer_email:     buyerEmail,
    buyer_phone:     buyerPhone,
    buyer_firstname: buyerFirstName,
    buyer_lastname:  buyerLastName,
    buyer_address:   'NA',
    buyer_city:      'NA',
    buyer_state:     'NA',
    buyer_country:   'India',
    buyer_pincode:   '000000',
    merchant_id:     cfg.merchantId,
  };

  const encdata  = encrypt(JSON.stringify(transactionData), encryptionKey);
  const checksum = generateChecksum(transactionData);

  const sortedKeys = Object.keys(transactionData).sort();
  const rawChecksumInput = sortedKeys.map(k => transactionData[k]).join('');
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  console.log('\n── Payment fields (plain, pre-encryption) ──');
  console.log(JSON.stringify(transactionData, null, 2));
  console.log('privatekey:', privatekey);
  console.log('encryptionKey used for encdata:', encryptionKey, '(md5 of username~:~password)');
  console.log('raw checksum input (sorted values concatenated):', rawChecksumInput);
  console.log('+ date appended:', rawChecksumInput + dateStr);
  console.log('checksum:  ', checksum);
  console.log('encdata (first 30 chars):', encdata.substring(0, 30) + '...');
  console.log('────────────────────────────────────────────\n');

  return {
    postUrl: `${AIRPAY_PAYMENT_BASE_URL}?token=${accessToken}`,

    formFields: {
      privatekey,
      merchant_id: cfg.merchantId,
      encdata,
      checksum,
    },
  };
}

function decryptCallbackData(encryptedResponse) {
  const cfg           = getConfig();
  const encryptionKey = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
  const decrypted     = decrypt(encryptedResponse, encryptionKey);
  return JSON.parse(decrypted);
}

module.exports = { getAccessToken, buildPaymentPayload, decryptCallbackData };
