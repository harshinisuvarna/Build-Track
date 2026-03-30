// src/pages/login_page.jsx
// CONNECTED TO BACKEND:
//  • Calls POST /api/auth/login with email + password
//  • Stores JWT in localStorage as "bt_token"
//  • Stores user object as "bt_user"
//  • Redirects to "/" (dashboard) on success
//  • Shows exact error message from server on failure

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";

const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "http://localhost:5000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const GitHubIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const features = [
  { icon: "📊", title: "Real-time dashboards",  desc: "Track every project metric live"  },
  { icon: "👷", title: "Worker management",     desc: "Manage teams across all sites"    },
  { icon: "💰", title: "Financial reporting",   desc: "Budgets, wages & profit margins"  },
  { icon: "📍", title: "Site tracking",         desc: "Monitor progress on every site"   },
];

export default function LoginPage() {
  const navigate = useNavigate();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [shake,      setShake]      = useState(false);
  const [emailErr,   setEmailErr]   = useState("");
  const [passErr,    setPassErr]    = useState("");
  const [serverErr,  setServerErr]  = useState(""); // ← real API errors shown here
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus,  setPassFocus]  = useState(false);
  const [vw,         setVw]         = useState(window.innerWidth);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg,   setForgotMsg]   = useState("");
  const [forgotErr,   setForgotErr]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    if (localStorage.getItem("bt_token")) navigate("/", { replace: true });
  }, []);

  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMobile  = vw < 640;
  const isDesktop = vw >= 1024;

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Main login handler ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    // Client-side validation first
    let valid = true;
    setEmailErr(""); setPassErr(""); setServerErr("");

    if (!validateEmail(email)) { setEmailErr("Please enter a valid email address."); valid = false; }
    if (password.length < 6)   { setPassErr("Password must be at least 6 characters."); valid = false; }
    if (!valid) { setShake(true); setTimeout(() => setShake(false), 420); return; }

    setLoading(true);
    try {

      const { data } = await authAPI.login({ email, password });



      // Persist token + user for the session
      localStorage.setItem("bt_token", data.token);
      localStorage.setItem("bt_user",  JSON.stringify(data.user));



      // Hard navigate so `RequireAuth` definitely re-evaluates
      window.location.assign("/");
    } catch (err) {

      const msg = err.response?.data?.message || "Something went wrong. Try again.";
      // 401 → credentials, anything else → general error banner
      if (err.response?.status === 401) {
        setPassErr(msg);
        setServerErr(msg);
      } else {
        setServerErr(msg);
      }
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally {
      setLoading(false);
    }
  };

  // (Enter key handled by <form onSubmit>)

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle = (focused, hasErr) => ({
    width: "100%", boxSizing: "border-box",
    padding: "13px 16px",
    border: `1.5px solid ${hasErr ? "#dc2626" : focused ? "#ea580c" : "#e8e8e8"}`,
    borderRadius: 10, fontSize: 14.5, color: "#111",
    background: focused ? "#fff" : "#fafafa",
    outline: "none",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
    boxShadow: focused
      ? `0 0 0 3.5px ${hasErr ? "rgba(220,38,38,0.11)" : "rgba(234,88,12,0.13)"}`
      : "none",
  });

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; }
    @keyframes btShake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
    @keyframes btSpin   { to { transform: rotate(360deg); } }
    @keyframes btFadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    .bt-left  { animation: fadeIn 0.55s ease both; }
    .bt-right { animation: slideUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.1s both; }
    .bt-feature { display:flex; align-items:center; gap:16px; transition:transform 0.18s; }
    .bt-feature:hover { transform: translateX(5px); }
    .bt-btn-primary {
      width:100%; padding:15px 0;
      background:#ea580c; color:#fff;
      border:none; border-radius:10px;
      font-size:14px; font-weight:700; letter-spacing:0.1em;
      cursor:pointer; font-family:'DM Sans',system-ui,sans-serif;
      box-shadow:0 6px 22px rgba(234,88,12,0.30);
      transition:background 0.18s,transform 0.12s,box-shadow 0.18s;
      display:flex; align-items:center; justify-content:center; gap:8px;
    }
    .bt-btn-primary:hover:not(:disabled) { background:#c2410c; box-shadow:0 8px 28px rgba(234,88,12,0.38); transform:translateY(-1px); }
    .bt-btn-primary:disabled { background:#f97316; cursor:not-allowed; }
    .bt-btn-social {
      display:flex; align-items:center; justify-content:center; gap:8px;
      padding:11px 14px; border:1.5px solid #ebebeb; border-radius:10px;
      background:#fff; color:#333; font-size:13.5px; font-weight:600;
      cursor:pointer; font-family:'DM Sans',system-ui,sans-serif;
      transition:background 0.15s,border-color 0.15s,transform 0.1s;
    }
    .bt-btn-social:hover { background:#f5f5f5; border-color:#d0d0d0; transform:translateY(-1px); }
    .bt-link-orange { color:#ea580c; font-weight:700; cursor:pointer; transition:color 0.15s; }
    .bt-link-orange:hover { color:#c2410c; text-decoration:underline; }
    .bt-footer-link { color:#c0ccd8; cursor:pointer; font-size:11.5px; transition:color 0.15s; }
    .bt-footer-link:hover { color:#94a3b8; }
  `;

  // ── Form ────────────────────────────────────────────────────────────────────
  const FormFields = (
    <div style={{ animation: shake ? "btShake 0.42s ease" : "none" }}>

      {/* Server-level error banner */}
      {serverErr && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#991b1b", animation: "btFadeUp 0.2s ease" }}>
          ⚠️ {serverErr}
        </div>
      )}

      {/* Email */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 7, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setEmailErr(""); setServerErr(""); }}
          onFocus={() => setEmailFocus(true)}
          onBlur={() => setEmailFocus(false)}
          placeholder="name@company.com"
          autoComplete="email"
          style={inputStyle(emailFocus, !!emailErr)}
        />
        {emailErr && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626", animation: "btFadeUp 0.2s ease" }}>{emailErr}</p>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 7, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Password
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={e => { setPassword(e.target.value); setPassErr(""); setServerErr(""); }}
            onFocus={() => setPassFocus(true)}
            onBlur={() => setPassFocus(false)}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ ...inputStyle(passFocus, !!passErr), paddingRight: 46 }}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex", alignItems: "center", lineHeight: 0 }}>
            {showPass ? <EyeClosed /> : <EyeOpen />}
          </button>
        </div>
        {passErr && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626", animation: "btFadeUp 0.2s ease" }}>{passErr}</p>}
      </div>

      <div style={{ textAlign: "right", marginBottom: 26 }}>
        <span onClick={() => { setShowForgot(v => !v); setForgotMsg(""); setForgotErr(""); }} className="bt-link-orange" style={{ fontSize: 13, cursor: "pointer" }}>{showForgot ? "← Back to login" : "Forgot password?"}</span>
      </div>

      {showForgot && (
        <div style={{ background: "#fff9f5", border: "1px solid #fed7aa", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 10 }}>Reset Password</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Enter your email and we'll send you a password reset link.</div>
          <input
            type="email"
            value={forgotEmail}
            onChange={e => { setForgotEmail(e.target.value); setForgotErr(""); }}
            placeholder="Your email address"
            style={{ ...inputStyle(false, false), marginBottom: 10 }}
          />
          <button
            onClick={async () => {
              setForgotMsg(""); setForgotErr("");
              if (!forgotEmail.trim()) { setForgotErr("Email is required."); return; }
              try {
                setForgotLoading(true);
                const { data } = await authAPI.forgotPassword({ email: forgotEmail });
                setForgotMsg(data.message || "If that email is registered, a reset link has been sent.");
              } catch (err) {
                setForgotErr(err.response?.data?.message || "Failed to send reset email.");
              } finally {
                setForgotLoading(false);
              }
            }}
            disabled={forgotLoading}
            style={{ width: "100%", padding: "11px 0", background: forgotLoading ? "#f59561" : "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: forgotLoading ? "not-allowed" : "pointer" }}>
            {forgotLoading ? "Sending…" : "Send Reset Link"}
          </button>
          {forgotMsg && <div style={{ marginTop: 10, fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ {forgotMsg}</div>}
          {forgotErr && <div style={{ marginTop: 10, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>⚠️ {forgotErr}</div>}
        </div>
      )}

      {/* Sign In button */}
      <button type="submit" className="bt-btn-primary" disabled={loading}>
        {loading && (
          <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "btSpin 0.7s linear infinite" }} />
        )}
        {loading ? "Signing in…" : "SIGN IN"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
        <span style={{ fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap", fontWeight: 500 }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
      </div>

      {/* Google only — full width */}
      <button
        className="bt-btn-social"
        type="button"
        style={{ width: "100%", marginBottom: 28 }}
        onClick={() => { window.location.href = `${API_ORIGIN}/api/auth/google`; }}
      >
        <GoogleIcon /> Continue with Google
      </button>

      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#94a3b8" }}>
          Don't have an account?{" "}
          <button
            type="button"
            className="bt-link-orange"
            onClick={() => {

              navigate("/signup");
            }}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#ea580c", fontWeight: 700 }}
          >
            Sign up free
          </button>
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span className="bt-footer-link">Privacy policy</span>
          <span style={{ color: "#e2e8f0", fontSize: 11 }}>·</span>
          <span className="bt-footer-link">Terms of service</span>
          <span style={{ color: "#e2e8f0", fontSize: 11 }}>·</span>
          <span className="bt-footer-link">Support</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {isDesktop ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100vw", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>

          {/* ── Left branding panel ── */}
          <div className="bt-left" style={{ background: "linear-gradient(150deg,#0f172a 0%,#1e293b 55%,#0c1f3f 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "0 72px", position: "relative", overflow: "hidden", height: "100vh" }}>
            <div style={{ position: "absolute", top: -120, right: -120, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(234,88,12,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -100, left: -100, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(234,88,12,0.09) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: "100%", background: "linear-gradient(to bottom,transparent,rgba(234,88,12,0.3),transparent)", pointerEvents: "none" }} />

            <div style={{ marginBottom: 52 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 48, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, marginBottom: 10 }}>
                <span style={{ color: "#fff" }}>Build</span><span style={{ color: "#ea580c" }}>Track</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>Construction management platform</p>
            </div>

            <h2 style={{ fontFamily: "'Syne',sans-serif", margin: "0 0 14px", fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1.18, maxWidth: 400 }}>
              Build smarter.<br /><span style={{ color: "#ea580c" }}>Track everything.</span>
            </h2>
            <p style={{ margin: "0 0 52px", fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 380, lineHeight: 1.75 }}>
              From site management to financial reporting — everything your construction team needs, in one place.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", maxWidth: 400 }}>
              {features.map((f, i) => (
                <div key={f.title} className="bt-feature" style={{ animation: `slideUp 0.5s cubic-bezier(.22,.68,0,1.2) ${0.25 + i * 0.08}s both` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: "rgba(234,88,12,0.13)", border: "1px solid rgba(234,88,12,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="bt-right" style={{ background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", overflowY: "auto" }}>
            <div style={{ width: "100%", maxWidth: 440, padding: "48px 56px" }}>
              <div style={{ marginBottom: 30 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", margin: "0 0 7px", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Welcome back</h1>
                <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>Sign in to your BuildTrack account</p>
              </div>
              <form onSubmit={handleLogin}>{FormFields}</form>
            </div>
          </div>
        </div>
      ) : (
        /* ── Mobile / Tablet ── */
        <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: isDesktop ? "center" : "flex-start", justifyContent: "center", padding: isMobile ? "40px 24px" : "48px", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
          <div style={{ width: "100%", maxWidth: 480 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 40, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 8 }}>
                <span style={{ color: "#0f172a" }}>Build</span><span style={{ color: "#ea580c" }}>Track</span>
              </div>
              <p style={{ fontSize: 12.5, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>Construction management</p>
            </div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Syne',sans-serif", margin: "0 0 7px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Welcome back</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>Sign in to your BuildTrack account</p>
            </div>
            <form onSubmit={handleLogin}>{FormFields}</form>
          </div>
        </div>
      )}
    </>
  );
}