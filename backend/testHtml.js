const metaRows = "<div>test</div>";
const req = { params: { token: '12345' }, ip: '127.0.0.1' };

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>...</style>
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

console.log(html);
