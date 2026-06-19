
// ============================================================================
// Standalone test — Simple Transaction payment payload.
//
// UPDATED to match AirPay's actual documented request body: only 4 form
// fields (privatekey, merchant_id, encdata, checksum) — no more plaintext
// buyer_*/amount fields posted directly.
//
// Writes test_payment_form.html (open in a real browser to see AirPay's
// hosted payment page) AND submits via axios directly so we can read the
// raw response/error text without needing a browser.
// ============================================================================

// NOTE: removed the forced Google-DNS override (dns.setServers) that was
// here before. The browser resolves payments.airpay.co.in fine using your
// normal network DNS — forcing 8.8.8.8/8.8.4.4 was causing Node's axios
// call to fail with ENOTFOUND for this specific host even though
// everything else worked. If you genuinely need Google DNS for other
// AirPay hosts (e.g. kraken.airpay.co.in) on your network, re-add it only
// around that specific call, not globally for the whole process.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const { buildPaymentPayload } = require('./utils/airpayService');

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
  console.log('--- AirPay Payment Payload Test (Simple Transaction) ---');
  try {
    const orderId = `TEST${Date.now()}`;

    const { postUrl, formFields } = await buildPaymentPayload({
      orderId,
      amount:         1,
      buyerEmail:     'test@buildtrack.com',
      buyerPhone:     '9999999999',
      buyerFirstName: 'Test',
      buyerLastName:  'User',
      returnUrl:      'https://build-track.onrender.com/api/subscriptions/callback',
    });

    console.log('orderId:', orderId);
    console.log('postUrl:', postUrl);
    console.log('privatekey (first 10):', formFields.privatekey?.substring(0, 10) + '...');
    console.log('checksum  (first 10):', formFields.checksum?.substring(0, 10) + '...');
    console.log('encdata   (first 20):', formFields.encdata?.substring(0, 20) + '...');

    // ── 1) Write the HTML form so you can still open it in a real browser ──
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>AirPay Payment Test</title></head>
<body>
  <p>Submitting to AirPay sandbox — do not close this tab...</p>
  <form id="f" action="${escapeHtml(postUrl)}" method="POST">
    <input type="hidden" name="privatekey"   value="${escapeHtml(formFields.privatekey)}" />
    <input type="hidden" name="merchant_id"  value="${escapeHtml(formFields.merchant_id)}" />
    <input type="hidden" name="encdata"      value="${escapeHtml(formFields.encdata)}" />
    <input type="hidden" name="checksum"     value="${escapeHtml(formFields.checksum)}" />
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
    formBody.append('privatekey',  formFields.privatekey);
    formBody.append('merchant_id', formFields.merchant_id);
    formBody.append('encdata',     formFields.encdata);
    formBody.append('checksum',    formFields.checksum);

    try {
      const response = await axios.post(postUrl, formBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 5,
        validateStatus: () => true,
      });

      console.log('HTTP status:', response.status);
      console.log('\n--- RAW RESPONSE BODY (first 3000 chars) ---');
      const bodyStr = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2);
      console.log(bodyStr.substring(0, 3000));

      const lowerBody = bodyStr.toLowerCase();
      if (lowerBody.includes('invalid') || lowerBody.includes('error') || lowerBody.includes('failed')) {
        console.log('\n⚠️  Response body contains an error/invalid/failed marker — see text above.');
      } else if (lowerBody.includes('<html') && !lowerBody.includes('error.php')) {
        console.log('\n✅ Looks like an actual payment page (no error.php redirect detected) — open test_payment_form.html in a browser to confirm visually.');
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
