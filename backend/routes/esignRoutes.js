const cloudinary = require('cloudinary').v2;
const express = require("express");
const crypto = require("crypto");
const EsignRequest = require("../models/EsignRequest");

const router = express.Router();

// 1. Request an E-Signature
router.post("/request", async (req, res) => {
  try {
    const { clientEmail, meta } = req.body;
    
    if (!clientEmail) {
      return res.status(400).json({ message: "clientEmail is required" });
    }

    const token = crypto.randomBytes(32).toString('hex');
    
    const esignReq = new EsignRequest({
      clientEmail,
      token,
      status: 'pending',
      meta: meta || {}
    });
    
    await esignReq.save();

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const signUrl = `${backendUrl}/api/esign/sign/${token}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Signature Requested</h2>
        <p>You have been requested to sign a cash receipt for BuildTrack.</p>
        <p>Please click the button below to review and sign the receipt:</p>
        <a href="${signUrl}" style="display: inline-block; padding: 12px 24px; background-color: #173EEA; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Sign Receipt</a>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">This link expires in 1 hour.</p>
      </div>
    `;

    if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: "BuildTrack", email: process.env.BREVO_SENDER_EMAIL },
          to: [{ email: clientEmail }],
          subject: "Signature Requested for BuildTrack Receipt",
          htmlContent: emailHtml
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API error:", errorData);
        return res.status(500).json({ message: "Failed to send signature request email via Brevo" });
      }
    } else {
      console.warn("Brevo credentials not configured. Email not sent.");
    }

    res.status(201).json({ 
      message: "E-Signature request created", 
      requestId: esignReq._id 
    });
  } catch (error) {
    console.error("Error creating e-sign request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. Get Details (Called by signature page to display receipt info)
router.get("/details/:token", async (req, res) => {
  try {
    const esignReq = await EsignRequest.findOne({ token: req.params.token });
    if (!esignReq) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }
    
    res.json({
      status: esignReq.status,
      meta: esignReq.meta,
      createdAt: esignReq.createdAt,
    });
  } catch (error) {
    console.error("Error fetching e-sign details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. Poll Status
router.get("/status/:id", async (req, res) => {
  try {
    const esignReq = await EsignRequest.findById(req.params.id);
    if (!esignReq) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    res.json({
      status: esignReq.status,
      signatureData: esignReq.signatureData,
      signedAt: esignReq.signedAt
    });
  } catch (error) {
    console.error("Error fetching e-sign status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. Submit Signature (Called by the client on the signature page)
router.post("/submit", async (req, res) => {
  try {
    const { token, signatureData } = req.body;
    
    if (!token || !signatureData) {
      return res.status(400).json({ message: "Token and signatureData are required" });
    }
    
    const esignReq = await EsignRequest.findOne({ token });
    if (!esignReq) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }
    
    if (esignReq.status === 'signed') {
      return res.status(400).json({ message: "This request has already been signed" });
    }
    
    esignReq.status = 'signed';
    esignReq.signatureData = signatureData;
    esignReq.signedAt = new Date();
    
    await esignReq.save();

    // Upload base64 receipt to Cloudinary so it can be viewed in email
    let receiptUrl = signatureData;
    if (process.env.CLOUDINARY_API_KEY) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(signatureData, {
          folder: 'buildtrack_receipts'
        });
        receiptUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Error uploading receipt to Cloudinary:", err);
      }
    }

    // Send the completed receipt to the client via email
    if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL && esignReq.clientEmail) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #15803D; text-align: center;">Receipt Authorized Successfully</h2>
          <p>Thank you! Your receipt authorization has been successfully recorded.</p>
          <p>Below is a copy of your signed receipt for your records:</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${receiptUrl}" target="_blank">
              <img src="${receiptUrl}" alt="Authorized Receipt" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;" />
            </a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #666; margin-top: 10px;">
            If the image does not load, <a href="${receiptUrl}">click here to view it</a>.
          </p>
        </div>
      `;

      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: "BuildTrack", email: process.env.BREVO_SENDER_EMAIL },
            to: [{ email: esignReq.clientEmail }],
            subject: "Your Authorized BuildTrack Receipt",
            htmlContent: emailHtml
          })
        });
        if (!response.ok) {
          console.error("Failed to send receipt email via Brevo");
        }
      } catch (err) {
        console.error("Error sending receipt email:", err);
      }
    }
    
    res.json({ message: "Signature submitted successfully" });
  } catch (error) {
    console.error("Error submitting signature:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 5. Serve Standalone HTML Signature Page
router.get("/sign/:token", async (req, res) => {
  try {
    const esignReq = await EsignRequest.findOne({ token: req.params.token });
    if (!esignReq) {
      return res.status(404).send(`
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Error</title></head>
        <body style="background-color: #F4F5FF; font-family: sans-serif; text-align: center; padding: 40px;">
          <h2>Invalid or expired token</h2>
        </body></html>
      `);
    }

    if (esignReq.status === 'signed') {
      return res.send(`
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Receipt Signed</title></head>
        <body style="background-color: #F4F5FF; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="color: #15803D;">✅ Receipt Signed</h2>
            <p>Thank you! This receipt has already been securely signed.</p>
          </div>
        </body></html>
      `);
    }

    const meta = esignReq.meta || {};
    const metaRows = Object.entries(meta).map(([key, val]) => {
      let formattedVal = val;
      if (key === 'amount') formattedVal = '₹' + val;
      else if (key === 'date' && val) formattedVal = new Date(val).toISOString().substring(0, 10);
      else if (!val) formattedVal = 'N/A';
      
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      return `<div class="row"><span class="label" style="text-transform: capitalize;">${label}</span><span class="value">${formattedVal}</span></div>`;
    }).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Review & Authorize Receipt</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          background-color: #F4F5FF;
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
        }
        .container {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          padding: 24px;
          box-sizing: border-box;
        }
        h2 {
          text-align: center;
          margin-top: 0;
          font-weight: 800;
          color: #1E1E2E;
        }
        .divider {
          height: 1px;
          background: #E2E4F6;
          margin: 20px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .label {
          color: #6B7280;
          font-weight: 600;
          font-size: 14px;
        }
        .value {
          color: #1E1E2E;
          font-weight: 700;
          font-size: 14px;
          text-align: right;
          max-width: 60%;
        }
        .btn {
          background-color: #173EEA;
          color: white;
          border: none;
          padding: 16px;
          width: 100%;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 20px;
          transition: background 0.2s;
        }
        .btn:hover { background-color: #102BB5; }
        .error { color: #DC2626; font-size: 14px; text-align: center; margin-top: 10px; display: none; }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    </head>
    <body>
      <div class="container">
        <h2>CASH RECEIPT</h2>
        <div class="divider"></div>
        ${metaRows}
        <div class="divider"></div>
        
        <p class="error" id="error-msg"></p>
        <button class="btn" id="submit">I Authorize & Sign</button>
      </div>

      <script>
        const token = "${req.params.token}";

        document.getElementById('submit').addEventListener('click', async () => {
          const errorMsg = document.getElementById('error-msg');
          errorMsg.style.display = 'none';
          document.getElementById('submit').innerText = "Authorizing...";
          document.getElementById('submit').disabled = true;

          // Inject the authorization stamp into the DOM
          const stampDiv = document.createElement('div');
          stampDiv.style.marginTop = '20px';
          stampDiv.style.padding = '10px';
          stampDiv.style.border = '2px dashed #15803D';
          stampDiv.style.borderRadius = '8px';
          stampDiv.style.textAlign = 'center';
          stampDiv.innerHTML = \`
            <h3 style="color: #15803D; margin: 0 0 5px 0;">✅ Authorized and Signed</h3>
            <p style="color: #6B7280; font-size: 12px; margin: 0;">IP: ${req.ip || "Unknown"}</p>
            <p style="color: #6B7280; font-size: 12px; margin: 0;">Date: ${new Date().toLocaleString()}</p>
          \`;
          
          const container = document.querySelector('.container');
          
          // Hide button and error before taking screenshot
          document.getElementById('submit').style.display = 'none';
          document.getElementById('error-msg').style.display = 'none';
          
          container.appendChild(stampDiv);

          // Take screenshot of the entire receipt
          const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const signatureData = canvas.toDataURL('image/jpeg', 0.9);

          try {
            const res = await fetch('/api/esign/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, signatureData })
            });
            if (res.ok) {
              document.body.innerHTML = \`
                <div class="container" style="text-align: center; padding: 40px; margin-top: 40px;">
                  <h2 style="color: #15803D; font-size: 40px; margin-bottom: 10px;">✅</h2>
                  <h2>Receipt Authorized</h2>
                  <p style="color: #6B7280; font-weight: 500;">Thank you! Your authorization has been securely recorded.</p>
                </div>
              \`;
            } else {
              const data = await res.json();
              errorMsg.innerText = data.message || "Failed to submit.";
              errorMsg.style.display = 'block';
              document.getElementById('submit').innerText = "I Authorize & Sign";
              document.getElementById('submit').disabled = false;
            }
          } catch (e) {
            errorMsg.innerText = "Network error. Try again.";
            errorMsg.style.display = 'block';
            document.getElementById('submit').innerText = "I Authorize & Sign";
            document.getElementById('submit').disabled = false;
          }
        });
      </script>
    </body>
    </html>
    `;
        res.send(html);
  } catch (error) {
    console.error("Error serving signature page:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
