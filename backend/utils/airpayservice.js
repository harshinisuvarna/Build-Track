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
const AIRPAY_PAYMENT_BASE_URL = 'https://payments.airpay.co.in/pay/v4/index.php';
async function getAccessToken() {
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
  return result.data.access_token;
}
async function buildPaymentPayload({
  orderId,
  amount,
  buyerEmail,
  buyerPhone,
  buyerFirstName,
  buyerLastName,
  buyerAddress,
  buyerCity,
  buyerState,
  buyerCountry,
  buyerPinCode,
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
    buyer_address:   buyerAddress || 'Not Available',
    buyer_city:      buyerCity || 'Not Available',
    buyer_state:     buyerState || 'Not Available',
    buyer_country:   buyerCountry || 'India',
    buyer_pincode:   buyerPinCode || '400001',
    merchant_id:     cfg.merchantId,
    custom_var:      returnUrl || '',
  };
  const encdata  = encrypt(JSON.stringify(transactionData), encryptionKey);
  const checksum = generateChecksum(transactionData);
  const sortedKeys = Object.keys(transactionData).sort();
  const rawChecksumInput = sortedKeys.map(k => transactionData[k]).join('');
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AirPay] Payment payload generated for order:', orderId);
  }
  return {
    postUrl: `${AIRPAY_PAYMENT_BASE_URL}?token=${accessToken}`,
    formFields: {
      privatekey,
      merchant_id: cfg.merchantId,
      encdata,
      checksum,
      chmod: '',
    },
  };
}
function decryptCallbackData(encryptedResponse) {
  const cfg = getConfig();
  const encryptionKey = generateEncryptionKeyFromCreds(cfg.username, cfg.password);
  const decrypted = decrypt(encryptedResponse, encryptionKey);
  return JSON.parse(decrypted);
}
function verifyAndDecryptCallbackData(reqBody) {
  if (!reqBody || !reqBody.response) {
    throw new Error('Unauthenticated payment callback: missing encrypted response payload');
  }
  const result = decryptCallbackData(reqBody.response);
  const dataObj = result.data || result;
  if (dataObj && dataObj.checksum) {
    const { checksum: _receivedChecksum, ...payloadToVerify } = dataObj;
    const computedChecksum = generateChecksum(payloadToVerify);
    if (dataObj.checksum !== computedChecksum) {
      throw new Error('Payment callback checksum verification failed');
    }
  }
  return result;
}
module.exports = { getAccessToken, buildPaymentPayload, decryptCallbackData, verifyAndDecryptCallbackData };
