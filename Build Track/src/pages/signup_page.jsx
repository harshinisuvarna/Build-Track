import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";

const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "http://localhost:5000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="#ea580c" />
    <path d="M5.5 10l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const features = [
  { icon: "📊", title: "Real-time dashboards",  desc: "Track every project metric live"  },
  { icon: "👷", title: "Worker management",     desc: "Manage teams across all sites"    },
  { icon: "💰", title: "Financial reporting",   desc: "Budgets, wages & profit margins"  },
  { icon: "📍", title: "Site tracking",         desc: "Monitor progress on every site"   },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [vw,           setVw]           = useState(window.innerWidth);
  const [fullName,     setFullName]      = useState("");
  const [email,        setEmail]         = useState("");
  const [password,     setPassword]      = useState("");
  const [confirm,      setConfirm]       = useState("");
  const [agreed,       setAgreed]        = useState(false);
  const [loading,      setLoading]       = useState(false);
  const [shake,        setShake]         = useState(false);
  const [nameFocus,    setNameFocus]     = useState(false);
  const [emailFocus,   setEmailFocus]    = useState(false);
  const [passFocus,    setPassFocus]     = useState(false);
  const [confirmFocus, setConfirmFocus]  = useState(false);
  const [errors,       setErrors]        = useState({});
  const [serverErr,    setServerErr]     = useState("");

  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);

  const isDesktop = vw >= 1024;
  const isMobile  = vw < 640;

  const validate = () => {
    const e = {};
    if (!fullName.trim())                              e.name    = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))    e.email   = "Enter a valid company email.";
    if (password.length < 6)                           e.password= "Min 6 characters required.";
    if (confirm !== password)                          e.confirm = "Passwords do not match.";
    if (!agreed)                                       e.agreed  = "Please accept the terms.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }
    setErrors({});
    setServerErr("");
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name:     fullName.trim(),
        email:    email.trim(),
        password,
      });
      localStorage.setItem("bt_token", data.token);
      localStorage.setItem("bt_user",  JSON.stringify(data.user));
      window.location.assign("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setServerErr(msg);
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = (focused, hasErr) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "13px 14px",
    border: `1.5px solid ${hasErr ? "#dc2626" : focused ? "#ea580c" : "#e0e0e0"}`,
    borderRadius: 10, background: "#fff",
    boxShadow: focused ? `0 0 0 3px ${hasErr ? "rgba(220,38,38,0.1)" : "rgba(234,88,12,0.1)"}` : "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
  });

  const inputField = {
    flex: 1, border: "none", outline: "none", fontSize: 15,
    color: "#1a1a1a", background: "transparent",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  };

  const errText = (msg) => msg ? (
    <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626", animation: "btFadeIn 0.2s ease" }}>{msg}</p>
  ) : null;

  return (
    <div style={{
      display: "flex", width: "100vw", height: "100vh",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes btShake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
        @keyframes btSpin   { to{transform:rotate(360deg)} }
        @keyframes btFadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .bt-feature { display:flex; align-items:center; gap:16px; transition:transform 0.18s; }
        .bt-feature:hover { transform: translateX(5px); }
      `}</style>

      {/* ── LEFT PANEL — dark branded (matches login) ── */}
      <div style={{
        width: "50%",
        background: "linear-gradient(145deg, #0d1322 0%, #1c2540 60%, #2a1a0e 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "60px 56px",
        position: "relative", overflow: "hidden",
        animation: "fadeIn 0.55s ease both",
      }}>
        {/* Glow blobs */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,90,26,.18) 0%, transparent 70%)", top: -100, right: -120, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,90,26,.10) 0%, transparent 70%)", bottom: -60, left: 40, pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 42, color: "#fff", letterSpacing: -1 }}>Build</span>
          <span style={{ fontWeight: 800, fontSize: 42, color: "#ea580c", letterSpacing: -1 }}>Track</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: "rgba(255,255,255,.4)", textTransform: "uppercase", marginBottom: 52 }}>
          Construction Management Platform
        </p>

        {/* Headline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 52, color: "#fff", lineHeight: 1.05 }}>Build smarter.</div>
          <div style={{ fontWeight: 800, fontSize: 52, color: "#ea580c", lineHeight: 1.05 }}>Track everything.</div>
        </div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)", lineHeight: 1.7, maxWidth: 300, marginBottom: 52 }}>
          From site management to financial reporting — everything your construction team needs, in one place.
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {features.map((f, i) => (
            <div key={i} className="bt-feature" style={{ animation: `slideUp 0.5s cubic-bezier(.22,.68,0,1.2) ${0.25 + i * 0.08}s both` }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: "rgba(255,255,255,.07)",
                border: "1px solid rgba(255,255,255,.1)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — signup form ── */}
      <div style={{
        width: "50%",
        background: "#fff",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflowY: "auto",
        animation: "slideUp 0.5s cubic-bezier(.22,.68,0,1.2) 0.1s both",
      }}>
        <div style={{ width: "100%", maxWidth: 440, padding: "48px 40px", boxSizing: "border-box" }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              Create your account
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
              Start your 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Server error banner */}
          {serverErr && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#991b1b" }}>
              ⚠️ {serverErr}
            </div>
          )}

          <div style={{ animation: shake ? "btShake 0.42s ease" : "none" }}>

            {/* Full Name */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>Full Name</label>
              <div style={inputWrap(nameFocus, !!errors.name)}>
                <UserIcon />
                <input value={fullName} onChange={e => { setFullName(e.target.value); setErrors(p => ({...p, name: ""})); }}
                  onFocus={() => setNameFocus(true)} onBlur={() => setNameFocus(false)}
                  placeholder="John Doe" style={inputField} />
              </div>
              {errText(errors.name)}
            </div>

            {/* Company Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>Company Email</label>
              <div style={inputWrap(emailFocus, !!errors.email)}>
                <MailIcon />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ""})); }}
                  onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)}
                  placeholder="john@company.com" style={inputField} />
              </div>
              {errText(errors.email)}
            </div>

            {/* Password + Confirm */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>Password</label>
                <div style={inputWrap(passFocus, !!errors.password)}>
                  <LockIcon />
                  <input type="password" value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: ""})); }}
                    onFocus={() => setPassFocus(true)} onBlur={() => setPassFocus(false)}
                    placeholder="••••••••" style={inputField} />
                </div>
                {errText(errors.password)}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>Confirm Password</label>
                <div style={inputWrap(confirmFocus, !!errors.confirm)}>
                  <ShieldIcon />
                  <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(p => ({...p, confirm: ""})); }}
                    onFocus={() => setConfirmFocus(true)} onBlur={() => setConfirmFocus(false)}
                    placeholder="••••••••" style={inputField} />
                </div>
                {errText(errors.confirm)}
              </div>
            </div>

            {/* Terms checkbox */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <div
                  onClick={() => { setAgreed(v => !v); setErrors(p => ({...p, agreed: ""})); }}
                  style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
                    border: `2px solid ${errors.agreed ? "#dc2626" : agreed ? "#ea580c" : "#d0d0d0"}`,
                    background: agreed ? "#ea580c" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", cursor: "pointer",
                  }}>
                  {agreed && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                  By creating an account, you agree to our{" "}
                  <span style={{ color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>
                  {" "}and{" "}
                  <span style={{ color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>.
                </span>
              </label>
              {errText(errors.agreed)}
            </div>

            {/* Submit */}
            <button
              type="button" onClick={handleSubmit} disabled={loading}
              style={{
                width: "100%", padding: "15px 0",
                background: loading ? "#f97316" : "#ea580c",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, letterSpacing: "0.06em",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                boxShadow: "0 6px 22px rgba(234,88,12,0.30)",
                transition: "background 0.18s, transform 0.1s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                marginBottom: 24,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#c2410c"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#ea580c"; }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={e   => { e.currentTarget.style.transform = "scale(1)"; }}>
              {loading
                ? <><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "btSpin 0.7s linear infinite" }} /> Creating account…</>
                : <>Create Account →</>
              }
            </button>

          </div>

          {/* Footer */}
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#94a3b8" }}>
              Already have an account?{" "}
              <span style={{ color: "#ea580c", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>
                Log in
              </span>
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {["Privacy policy", "Terms of service", "Support"].map((link, i, arr) => (
                <>
                  <span key={link} style={{ fontSize: 12, color: "#cbd5e1", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
                    onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}>
                    {link}
                  </span>
                  {i < arr.length - 1 && <span key={`dot-${i}`} style={{ color: "#e2e8f0", fontSize: 11 }}>·</span>}
                </>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}