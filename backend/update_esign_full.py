import os

path = r'c:\build-track\Build-Track\backend\routes\esignRoutes.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the POST /submit route to send email
old_submit_start = """    esignReq.status = 'signed';
    esignReq.signatureData = signatureData;
    esignReq.signedAt = new Date();
    
    await esignReq.save();
    
    res.json({ message: "Signature submitted successfully" });"""

new_submit = """    esignReq.status = 'signed';
    esignReq.signatureData = signatureData;
    esignReq.signedAt = new Date();
    
    await esignReq.save();

    // Send the completed receipt to the client via email
    if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL && esignReq.clientEmail) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #15803D; text-align: center;">Receipt Authorized Successfully</h2>
          <p>Thank you! Your receipt authorization has been successfully recorded.</p>
          <p>Below is a copy of your signed receipt for your records:</p>
          <div style="text-align: center; margin-top: 20px;">
            <img src="${signatureData}" alt="Authorized Receipt" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;" />
          </div>
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
    
    res.json({ message: "Signature submitted successfully" });"""

content = content.replace(old_submit_start, new_submit)

# 2. Update the HTML page to include html2canvas and take a screenshot of the whole receipt
old_head_end = """      </style>
    </head>
    <body>"""

new_head_end = """      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    </head>
    <body>"""

content = content.replace(old_head_end, new_head_end)

# 3. Update the click handler script
old_script = """          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 400, 100);
          ctx.fillStyle = '#15803D';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('Authorized and Signed', 20, 40);
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#6B7280';
          ctx.fillText('IP: ${req.ip || "Unknown"}', 20, 65);
          ctx.fillText('Date: ' + new Date().toLocaleString(), 20, 85);
          const signatureData = canvas.toDataURL('image/png');"""

new_script = """          // Inject the authorization stamp into the DOM
          const stampDiv = document.createElement('div');
          stampDiv.style.marginTop = '20px';
          stampDiv.style.padding = '10px';
          stampDiv.style.border = '2px dashed #15803D';
          stampDiv.style.borderRadius = '8px';
          stampDiv.style.textAlign = 'center';
          stampDiv.innerHTML = `
            <h3 style="color: #15803D; margin: 0 0 5px 0;">✅ Authorized and Signed</h3>
            <p style="color: #6B7280; font-size: 12px; margin: 0;">IP: ${req.ip || "Unknown"}</p>
            <p style="color: #6B7280; font-size: 12px; margin: 0;">Date: ${new Date().toLocaleString()}</p>
          `;
          
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
          const signatureData = canvas.toDataURL('image/jpeg', 0.9);"""

content = content.replace(old_script, new_script)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated esignRoutes.js successfully!")
