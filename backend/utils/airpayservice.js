// ============================================================================
// AirPay v4 service layer
//
// CONFIRMED via live OAuth2 test:
//   - Encryption key for OAuth2 = md5(username + "~:~" + password)
//
// REWRITTEN (this version) to match the official "Simple Transaction" doc:
//   https://docs.airpay.co.in/v4/payments/simple-transaction/
//
// KEY FINDING: the previous version was sending ALL buyer/order fields as
// individual plaintext form fields (buyerEmail, amount, orderid, ...).
// AirPay's Simple Transaction endpoint does NOT accept that. Per the docs'
// own PHP sample, the POST body must contain ONLY 4 fields:
//
//     privatekey   = sha256(secret + "@" + username + ":|:" + password)
//     merchant_id   = your merchant id
//     encdata       = AES-256-CBC encrypted JSON of the transaction fields
//     checksum      = sha256(sorted-values-concatenated + today's date)
//
// The transaction fields that go INSIDE encdata (and are used to compute
// the checksum) use snake_case names, NOT camelCase:
//     orderid, amount, currency_code, iso_currency,
//     buyer_email, buyer_phone, buyer_firstname, buyer_lastname,
//     buyer_address, buyer_city, buyer_state, buyer_country, buyer_pincode
//
// UNVERIFIED / NEXT THING TO CHECK IF THIS STILL FAILS:
//   The Simple Transaction PHP sample encrypts with a variable called
//   $secretKey, separate from $secret (used in privatekey) and the OAuth2
//   creds. The docs don't define $secretKey anywhere else, so this code
//   currently assumes it's the SAME md5(username~:~password) key that was
//   empirically confirmed for OAuth2 — i.e. one encryption key used
//   everywhere. If AirPay still rejects this, the most likely fix is that
//   $secretKey is actually a distinct value from your AirPay dashboard
//   (sometimes called "Encryption Key" or "AES Key", separate from
//   Client Secret) — ask AirPay support to confirm if unsure.
// ============================================================================
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

// ── STEP 2: Build payment payload (Simple Transaction) ────────────
async function buildPaymentPayload({
  orderId,
  amount,
  buyerEmail,
  buyerPhone,
  buyerFirstName,
  buyerLastName,
  returnUrl, // NOTE: Simple Transaction's documented fields don't include
             // a return-url param in the request body itself — the
             // success/failure redirect URL is configured on AirPay's
             // merchant dashboard, not passed per-request. Kept as a
             // param here in case you're also using it for your own
             // bookkeeping/logs, but it is NOT sent to AirPay below.
}) {
  const cfg             = getConfig();
  const encryptionKey   = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
  const accessToken     = await getAccessToken();
  const amountFormatted = Number(amount).toFixed(2);

  const privatekey = generatePrivateKey(process.env.AIRPAY_API_KEY || cfg.secret, cfg.username, cfg.password);

  // Exactly the fields from the Simple Transaction PHP sample, snake_case.
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

  // Diagnostic only — the exact string that gets SHA-256 hashed into the
  // checksum above. Useful to hand to AirPay support if they ask you to
  // confirm what was hashed, since it's otherwise irreversible.
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
    // Per the docs' PHP sample, these are the ONLY 4 fields to POST.
    formFields: {
      privatekey,
      merchant_id: cfg.merchantId,
      encdata,
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