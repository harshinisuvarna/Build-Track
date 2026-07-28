import os

path = r'c:\build-track\Build-Track\backend\routes\esignRoutes.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add cloudinary requirement if not exists
if 'const cloudinary' not in content:
    content = "const cloudinary = require('cloudinary').v2;\n" + content

# Update the email sending logic in POST /submit
old_email_logic = """    // Send the completed receipt to the client via email
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
    }"""

new_email_logic = """    // Upload base64 receipt to Cloudinary so it can be viewed in email
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
    }"""

content = content.replace(old_email_logic, new_email_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated esignRoutes.js successfully!")
