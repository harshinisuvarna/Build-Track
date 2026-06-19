// ============================================================================
// AirPay service layer — rebuilt to match AirPay's OFFICIAL Node SDK
// (index.js + PDF integration guide, provided directly by AirPay).
//
// This mirrors the actual route handler structure from their SDK:
//   1. Build snake_case dataObject (buyer_email, buyer_firstname, ...,
//      merchant_id) from your form input.
//   2. privatekey = sha256(secret + '@' + username + ':|:' + password)
//   3. checksum   = sha256(sorted-values-of-dataObject + today's date)
//   4. encdata    = AES-256-CBC encrypt(JSON.stringify(dataObject), key)
//      where key = md5(username + '~:~' + password)
//   5. Separately: get an OAuth2 access_token (same encrypt/checksum
//      primitives, different payload: client_id/client_secret/grant_type/
//      merchant_id), append it to the payment URL as ?token=...
//   6. The actual HTML form posted to AirPay sends: mid, data (the
//      encrypted blob from step 4), privatekey, checksum — to:
//      https://payments.airpay.co.in/pay/v4/index.php?token=<access_token>
//
// Token URL (note the /token.php suffix, confirmed from SDK source):
//   https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/token.php
// ============================================================================
const axios = require('axios');
const {
  generatePrivateKey,
  generateChecksum,
  checksumcal,
  encrypt,
  decrypt,
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

// Confirmed from SDK source — note the /token.php suffix.
const AIRPAY_OAUTH_URL = 'https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/token.php';
const AIRPAY_PAYMENT_BASE_URL = 'https://payments.airpay.co.in/pay/v4/index.php';

let cachedToken    = null;
let tokenExpiresAt = 0;

// ── STEP 1: OAuth2 token ──────────────────────────────────────────
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

  console.log('\n── OAuth2 request ──');
  console.log('URL:', AIRPAY_OAUTH_URL);
  console.log('merchant_id:', cfg.merchantId);
  console.log('checksum:', checksum);
  console.log('────────────────────\n');

  const response = await axios.post(AIRPAY_OAUTH_URL, formBody, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  console.log('HTTP status:', response.status);
  console.log('Raw response.data:', JSON.stringify(response.data));

  if (!response.data.response) {
    throw new Error('AirPay OAuth2: no "response" field in reply. Raw: ' + JSON.stringify(response.data));
  }

  const rawResponseStr = response.data.response;
  console.log('\n── Decryption diagnostics ──');
  console.log('encryptionKey used:', encryptionKey, '(length', encryptionKey.length, ')');
  console.log('typeof rawResponseStr:', typeof rawResponseStr);
  console.log('raw response string length:', rawResponseStr.length);
  console.log('JSON-escaped raw value (to catch hidden whitespace/quotes):', JSON.stringify(rawResponseStr));
  console.log('first 16 chars (NOT used as IV in this version):', rawResponseStr.substring(0, 16));
  console.log('rest length (should be valid base64, i.e. divisible by 4):', rawResponseStr.length - 16, '-> divisible by 4?', (rawResponseStr.length - 16) % 4 === 0);

  let decrypted;
  try {
    decrypted = decrypt(rawResponseStr, encryptionKey);
    console.log('decrypted (raw):', decrypted);
    console.log('decrypted length:', decrypted.length);
  } catch (decryptErr) {
    console.log('❌ decrypt() THREW an error:', decryptErr.message);
    throw decryptErr;
  }
  console.log('────────────────────────────\n');

  let result;
  try {
    result = JSON.parse(decrypted);
  } catch (parseErr) {
    throw new Error(
      `Decryption produced non-JSON output (decryption likely used the wrong key/IV). ` +
      `Raw decrypted text: ${JSON.stringify(decrypted)} — Parse error: ${parseErr.message}`
    );
  }

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

// ── STEP 2: Build payment payload ────────────────────────────────
// Mirrors the SDK route handler exactly: builds the snake_case
// dataObject, computes privatekey/checksum from it, encrypts it into
// `data`, and returns everything needed for the form (mid, data,
// privatekey, checksum) plus the token-bearing post URL.
async function buildPaymentPayload({
  orderId,
  amount,
  buyerEmail,
  buyerPhone,
  buyerFirstName,
  buyerLastName,
  buyerAddress = 'NA',
  buyerCity    = 'NA',
  buyerState   = 'NA',
  buyerCountry = 'India',
  buyerPinCode = '000000',
}) {
  const cfg             = getConfig();
  const encryptionKey   = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
  const accessToken     = await getAccessToken();
  const amountFormatted = String(amount); // AirPay expects a string with 2 decimals, e.g. "1.00"

  // Exactly the snake_case dataObject from the SDK's route handler.
  const dataObject = {
    buyer_email:     buyerEmail,
    buyer_firstname: buyerFirstName,
    buyer_lastname:  buyerLastName,
    buyer_address:   buyerAddress,
    buyer_city:      buyerCity,
    buyer_state:     buyerState,
    buyer_country:   buyerCountry,
    amount:          amountFormatted,
    orderid:         orderId,
    buyer_phone:     buyerPhone,
    buyer_pincode:   buyerPinCode,
    iso_currency:    'INR',
    currency_code:   '356',
    merchant_id:     cfg.merchantId,
  };

  const privatekey = generatePrivateKey(cfg.secret, cfg.username, cfg.password);
  const { checksum, debugString } = checksumcal(dataObject);
  const encryptedData = encrypt(JSON.stringify(dataObject), encryptionKey);

  console.log('\n── Payment fields (plain, pre-encryption) ──');
  console.log(JSON.stringify(dataObject, null, 2));
  console.log('privatekey:', privatekey);
  console.log('checksum input string (sorted values + date):', debugString);
  console.log('checksum:', checksum);
  console.log('encrypted data (first 30 chars):', encryptedData.substring(0, 30) + '...');
  console.log('─────────────────────────────────────────────\n');

  return {
    postUrl: `${AIRPAY_PAYMENT_BASE_URL}?token=${encodeURIComponent(accessToken)}`,
    // Matches the SDK's rendered template fields exactly: mid, data, privatekey, checksum
    formFields: {
      mid: cfg.merchantId,
      data: encryptedData,
      privatekey,
      checksum,
    },
  };
}

// ── Decrypt AirPay callback ───────────────────────────────────────
function decryptCallbackData(encryptedResponse) {
  const cfg           = getConfig();
  const encryptionKey = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
  const decrypted     = decrypt(encryptedResponse, encryptionKey);
  return JSON.parse(decrypted);
}

module.exports = { getAccessToken, buildPaymentPayload, decryptCallbackData };