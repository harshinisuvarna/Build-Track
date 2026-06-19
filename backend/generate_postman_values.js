// ============================================================================
// Generates the exact field values you need to paste into Postman.
// Does NOT make any HTTP calls itself — just prints values to copy.
//
// USAGE:
//   1. Place this file in backend/ (next to .env and utils/)
//   2. Run: node generate_postman_values.js
//   3. Copy the printed values into Postman as described in the chat.
// ============================================================================
require('dotenv').config();
const {
  encrypt,
  generateChecksum,
  generatePrivateKey,
  generateEncryptionKeyFromCreds,
} = require('./utils/airpayCrypto');

const cfg = {
  merchantId: (process.env.AIRPAY_MERCHANT_ID || '').trim(),
  clientId:   (process.env.AIRPAY_CLIENT_ID   || '').trim(),
  secret:     (process.env.AIRPAY_SECRET_KEY  || '').trim(),
  username:   (process.env.AIRPAY_USERNAME    || '').trim(),
  password:   (process.env.AIRPAY_PASSWORD    || '').trim(),
};

const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.log('❌ Missing env vars:', missing.join(', '));
  process.exit(1);
}

const encryptionKey = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
const privatekey    = generatePrivateKey(cfg.secret, cfg.username, cfg.password);

// ── 1) OAuth2 payload (for getting an access_token in Postman) ──────────
const oauthPayload = {
  client_id:     cfg.clientId,
  client_secret: cfg.secret,
  grant_type:    'client_credentials',
  merchant_id:   cfg.merchantId,
};
const oauthEncdata  = encrypt(JSON.stringify(oauthPayload), encryptionKey);
const oauthChecksum = generateChecksum(oauthPayload);

// ── 2) Payment transaction payload (for the /pay/v4/ step) ──────────────
const orderId = `TEST${Date.now()}`;
const transactionData = {
  orderid:         orderId,
  amount:          '1.00',
  currency_code:   '356',
  iso_currency:    'INR',
  buyer_email:     'test@buildtrack.com',
  buyer_phone:     '9999999999',
  buyer_firstname: 'Test',
  buyer_lastname:  'User',
  buyer_address:   'NA',
  buyer_city:      'NA',
  buyer_state:     'NA',
  buyer_country:   'India',
  buyer_pincode:   '000000',
};
const paymentEncdata  = encrypt(JSON.stringify(transactionData), encryptionKey);
const paymentChecksum = generateChecksum(transactionData);

console.log('============================================================');
console.log('STEP 1 — OAuth2 request  (POST to kraken.airpay.co.in)');
console.log('URL:  https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/');
console.log('Body type: x-www-form-urlencoded');
console.log('------------------------------------------------------------');
console.log('merchant_id =', cfg.merchantId);
console.log('encdata     =', oauthEncdata);
console.log('checksum    =', oauthChecksum);
console.log('============================================================\n');

console.log('============================================================');
console.log('STEP 2 — Payment request  (POST to payments.airpay.co.in)');
console.log('URL:  https://payments.airpay.co.in/pay/v4/?token=<PASTE_ACCESS_TOKEN_FROM_STEP_1_HERE>');
console.log('Body type: x-www-form-urlencoded');
console.log('------------------------------------------------------------');
console.log('privatekey  =', privatekey);
console.log('merchant_id =', cfg.merchantId);
console.log('encdata     =', paymentEncdata);
console.log('checksum    =', paymentChecksum);
console.log('------------------------------------------------------------');
console.log('orderId used:', orderId);
console.log('(plain transaction data, for your reference only — NOT sent as-is):');
console.log(JSON.stringify(transactionData, null, 2));
console.log('============================================================\n');

console.log('NOTE: encdata/checksum above are time-sensitive (checksum includes');
console.log('today\'s date) and orderid is unique per run. If you wait until');
console.log('tomorrow to test, or re-run this script, regenerate fresh values.');