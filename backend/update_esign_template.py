import os

def update_esign_routes():
    path = r'C:\build-track\Build-Track\backend\routes\esignRoutes.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the block where variables are destructured
    start_var = content.find('const { projectName, type, amount, date } = esignReq.meta || {};')
    html_start = content.find('const html = `', start_var)
    html_end = content.find('    res.send(html);', html_start)
    
    if start_var == -1 or html_start == -1 or html_end == -1:
        print("Could not find blocks in esignRoutes.js")
        return

    # Extract dynamic meta mapping
    new_html = """const meta = esignReq.meta || {};
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

          const canvas = document.createElement('canvas');
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
          const signatureData = canvas.toDataURL('image/png');

          try {
            const res = await fetch('/api/esign/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, signatureData })
            });
            if (res.ok) {
              document.body.innerHTML = \\`
                <div class="container" style="text-align: center; padding: 40px; margin-top: 40px;">
                  <h2 style="color: #15803D; font-size: 40px; margin-bottom: 10px;">✅</h2>
                  <h2>Receipt Authorized</h2>
                  <p style="color: #6B7280; font-weight: 500;">Thank you! Your authorization has been securely recorded.</p>
                </div>
              \\`;
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
"""
    content = content[:start_var] + new_html + "    " + content[html_end:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

update_esign_routes()
print("Updated esignRoutes.js")
