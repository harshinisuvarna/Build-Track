import sys
import re

file_path = 'C:/build-track/Build-Track/Build Track/src/pages/login_page.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variables
state_vars = '''  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const [showReset, setShowReset] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);'''

content = re.sub(r'  const \[showForgot, setShowForgot\] = useState\(false\);.*?  const \[forgotLoading, setForgotLoading\] = useState\(false\);', state_vars, content, flags=re.DOTALL)

# 2. Update handleForgotSubmit
handle_submit = '''  const handleForgotSubmit = async () => {
    setForgotMsg("");
    setForgotErr("");
    if (!forgotEmail.trim()) {
      setForgotErr("Email is required.");
      return;
    }
    setForgotLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email: forgotEmail });
      setForgotMsg(data.message || "A reset link has been sent to your email.");
      setShowReset(true);
    } catch (err) {
      setForgotErr(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };'''
content = re.sub(r'  const handleForgotSubmit = async \(\) => \{.*?  \};', handle_submit, content, flags=re.DOTALL)

# 3. Add token block
token_block = '''                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleForgotSubmit}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                      color: "#FFF",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: forgotLoading ? "not-allowed" : "pointer",
                      opacity: forgotLoading ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)"
                    }}
                  >
                    {forgotLoading && <span className="spinner-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />}
                    {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                  </button>

                  {showReset && (
                    <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 14, padding: "18px", marginBottom: 24, marginTop: 16 }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: "13.5px", fontWeight: "700", color: "#1F2937" }}>Enter Reset Token</h4>
                      <LightPremiumInput type="text" label="Reset Token" icon={Lock} value={resetToken} onChange={e => setResetToken(e.target.value)} />
                      <LightPremiumInput type="password" label="New Password" icon={Lock} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      <button type="button" disabled={resetLoading} onClick={async () => {
                        setResetLoading(true);
                        setForgotErr("");
                        try {
                          const { data } = await authAPI.resetPassword({ token: resetToken, password: newPassword });
                          setForgotMsg(data.message || "Password reset successful!");
                          setShowReset(false);
                          setShowForgot(false);
                        } catch(err) { 
                          setForgotErr(err.response?.data?.message || "Reset failed"); 
                        } finally { 
                          setResetLoading(false); 
                        }
                      }} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", color: "#FFF", fontWeight: "700", border: "none", cursor: resetLoading ? "not-allowed" : "pointer", opacity: resetLoading ? 0.6 : 1 }}>
                        {resetLoading ? "Resetting..." : "Reset Password"}
                      </button>
                    </div>
                  )}'''

content = re.sub(r'                  <button\s+type="button"\s+disabled=\{forgotLoading\}.*?Sending Link\.\.\." : "Send Reset Link"\}\s+</button>', token_block, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
