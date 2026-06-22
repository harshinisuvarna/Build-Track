// ============================================================================
// Standalone test — matches AirPay's OFFICIAL Node SDK flow exactly.
//
// Posts to: https://payments.airpay.co.in/pay/v4/index.php?token=...
// Form fields: mid, data, privatekey, checksum  (NOT encdata/merchant_id —
// those names were our own earlier guesses; "mid" and "data" are what the
// actual SDK route handler renders into its template).
// ============================================================================
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
// No forced DNS server override — let it use your normal network DNS.

require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const { buildPaymentPayload } = require('./utils/airpayservice');

function openInBrowser(filePath) {
  const cmd = process.platform === 'win32'
    ? `start "" "${filePath}"`
    : process.platform === 'darwin'
      ? `open "${filePath}"`
      : `xdg-open "${filePath}"`;
  exec(cmd, (err) => {
    if (err) console.log('Open this file manually in your browser:', filePath);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function testPayment() {
  console.log('--- AirPay Payment Payload Test (official SDK flow) ---');
  try {
    const orderId = `TEST${Date.now()}`;

    const { postUrl, formFields } = await buildPaymentPayload({
  orderId,
  amount: '1.00', // AirPay expects a string with 2 decimals, e.g. "1.00"
  buyerEmail: 'test@buildtrack.com',
  buyerPhone: '9999999999',
  buyerFirstName: 'Test',
  buyerLastName: 'User',
  buyerAddress: 'MG Road',
  buyerCity: 'Bangalore',
  buyerState: 'Karnataka',
  buyerCountry: 'India',
  buyerPinCode: '560001',
});
    console.log("\n=== PAYMENT REQUEST ===");
console.log("POST URL:", postUrl);
console.log("MID:", formFields.mid);
console.log("PRIVATEKEY:", formFields.privatekey);
console.log("CHECKSUM:", formFields.checksum);
console.log("DATA:", formFields.data);
console.log("=======================\n");

    console.log('orderId:', orderId);
    console.log('postUrl:', postUrl);
    console.log('mid:', formFields.mid);
    console.log('privatekey (first 10):', formFields.privatekey?.substring(0, 10) + '...');
    console.log('checksum  (first 10):', formFields.checksum?.substring(0, 10) + '...');
    console.log('data      (first 20):', formFields.data?.substring(0, 20) + '...');

    // ── 1) Write the HTML form so you can open it in a real browser ──
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>AirPay Payment Test</title></head>
<body>
  <p>Submitting to AirPay sandbox — do not close this tab...</p>
  <form id="f" action="${escapeHtml(postUrl)}" method="POST">
    <input type="hidden" name="mid"        value="${escapeHtml(formFields.mid)}" />
    <input type="hidden" name="data"       value="${escapeHtml(formFields.data)}" />
    <input type="hidden" name="privatekey" value="${escapeHtml(formFields.privatekey)}" />
    <input type="hidden" name="checksum"   value="${escapeHtml(formFields.checksum)}" />
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`;

    const outPath = path.join(__dirname, 'test_payment_form.html');
    fs.writeFileSync(outPath, html);
    console.log('\n✅ Wrote', outPath);

    // ── 2) ALSO submit directly via axios so we can see the raw response ──
    console.log('\n── Submitting directly via axios to inspect raw response ──');
    const formBody = new URLSearchParams();
    formBody.append('mid',        formFields.mid);
    formBody.append('data',       formFields.data);
    formBody.append('privatekey', formFields.privatekey);
    formBody.append('checksum',   formFields.checksum);

    try {
      const response = await axios.post(postUrl, formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://build-track.onrender.com',
          'Referer': 'https://build-track.onrender.com/',
          'x-api-key': process.env.AIRPAY_API_KEY || ''
        },
        maxRedirects: 5,
        validateStatus: () => true,
      });

      console.log('HTTP status:', response.status);
      console.log('\n--- FULL RAW RESPONSE BODY ---');

const bodyStr = typeof response.data === 'string'
  ? response.data
  : JSON.stringify(response.data, null, 2);

console.log(bodyStr);

      const lowerBody = bodyStr.toLowerCase();
      if (lowerBody.includes('invalid') || lowerBody.includes('error') || lowerBody.includes('failed')) {
        console.log('\n⚠️  Response body contains an error/invalid/failed marker — see text above.');
      } else if (lowerBody.includes('<html') && !lowerBody.includes('error.php')) {
        console.log('\n✅ Looks like an actual payment page — open test_payment_form.html in a browser to confirm visually.');
      }
    } catch (axiosErr) {
      console.log('❌ Direct axios submission failed:', axiosErr.message);
      if (axiosErr.response) {
        console.log('HTTP status:', axiosErr.response.status);
        console.log('Body:', JSON.stringify(axiosErr.response.data, null, 2).substring(0, 3000));
      }
    }

    console.log('\nOpening HTML form in browser too (visual confirmation)...');
    openInBrowser(outPath);

  } catch (err) {
    console.log('❌ FAILED:', err.message);
    if (err.response?.data) {
      console.log('AirPay response:', JSON.stringify(err.response.data, null, 2));
    }
  }
  
}

testPayment();