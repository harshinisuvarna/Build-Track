import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";

function LogoIcon({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(145deg, #f97316, #ea580c)",
      borderRadius: size * 0.25,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 8px rgba(234,88,12,0.35)", flexShrink: 0,
    }}>
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none">
        <rect x="6" y="10" width="24" height="22" rx="2" fill="white" />
        <polygon points="18,2 32,11 4,11" fill="white" />
        <rect x="9"  y="15" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="22" y="15" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="9"  y="23" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="22" y="23" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="14" y="24" width="8" height="8" rx="1" fill="#ea580c" />
      </svg>
    </div>
  );
}

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
  const isTablet  = vw >= 640 && vw < 1024;
  const isMobile  = vw < 640;
  const scale     = Math.min(Math.max(vw / 1440, 0.65), 1.15);
  const fs        = (b) => Math.round(b * scale);

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
      // Save token and user — same keys as login
      localStorage.setItem("bt_token", data.token);
      localStorage.setItem("bt_user",  JSON.stringify(data.user));
      // Go to dashboard
      window.location.href = "/";
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
    padding: `${fs(13)}px ${fs(14)}px`,
    border: `1.5px solid ${hasErr ? "#dc2626" : focused ? "#ea580c" : "#e0e0e0"}`,
    borderRadius: fs(12), background: "#fff",
    boxShadow: focused ? `0 0 0 3px ${hasErr ? "rgba(220,38,38,0.1)" : "rgba(234,88,12,0.1)"}` : "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
  });

  const inputField = {
    flex: 1, border: "none", outline: "none", fontSize: fs(15),
    color: "#1a1a1a", background: "transparent",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  };

  const errText = (msg) => msg ? (
    <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626", animation: "btFadeIn 0.2s ease" }}>{msg}</p>
  ) : null;

  /* ── Left brand panel ── */
  const BrandPanel = (
    <div style={{
      flex: isDesktop ? "0 0 52%" : "none",
      width: isDesktop ? "52%" : "100%",
      height: isDesktop ? "100%" : 320,
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
      padding: isDesktop ? `${fs(48)}px ${fs(56)}px` : "28px 24px",
    }}>
      {/* Background image overlay */}
      <img
        src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&fit=crop"
        alt="construction site"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
      />
      {/* Dark gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,15,30,0.92) 0%, rgba(10,15,30,0.6) 50%, rgba(10,15,30,0.35) 100%)", zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 14px", marginBottom: fs(24) }}>
        </div>

        {/* Headline */}
        <h2 style={{ margin: `0 0 ${fs(16)}px`, fontSize: fs(42), fontWeight: 900, color: "#fff", lineHeight: 1.1, maxWidth: 500 }}>
          Streamline your projects from{" "}
          <span style={{ color: "#ea580c" }}>groundwork</span>{" "}
          to finish.
        </h2>

        {/* Description */}
        <p style={{ margin: `0 0 ${fs(28)}px`, fontSize: fs(15), color: "rgba(255,255,255,0.65)", maxWidth: 440, lineHeight: 1.75 }}>
          BuildTrack provides the industry-standard suite for tracking resources, managing timelines, and ensuring safety compliance on every job site.
        </p>

        {/* Feature bullets */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${fs(16)}px ${fs(24)}px` }}>
          {[
            ["Real-time Data",      "Live updates from the field."],
            ["Resource Tracking",   "Inventory and fleet management."],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckIcon />
              <div>
                <div style={{ fontSize: fs(14), fontWeight: 700, color: "#fff", marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: fs(12), color: "rgba(255,255,255,0.5)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Right form panel ── */
  const FormPanel = (
    <div style={{
      flex: isDesktop ? "0 0 48%" : "none",
      width: isDesktop ? "48%" : "100%",
      background: "#f7f7f8",
      display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>
      <div style={{
        maxWidth: 560, width: "100%", margin: "0 auto",
        padding: isDesktop ? `${fs(56)}px ${fs(48)}px` : isTablet ? "40px 40px" : "32px 20px",
        boxSizing: "border-box",
      }}>

        {/* Heading */}
        <div style={{ marginBottom: fs(28) }}>
          <h1 style={{ margin: "0 0 8px", fontSize: fs(28), fontWeight: 800, color: "#1a1a1a" }}>
            Create your account
          </h1>
          <p style={{ margin: 0, fontSize: fs(14), color: "#888" }}>
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
          <style>{`
            @keyframes btShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
            @keyframes btSpin  { to{transform:rotate(360deg)} }
            @keyframes btFadeIn{ from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
          `}</style>

          {/* Full Name */}
          <div style={{ marginBottom: fs(18) }}>
            <label style={{ display: "block", fontSize: fs(13), fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>
              Full Name
            </label>
            <div style={inputWrap(nameFocus, !!errors.name)}>
              <UserIcon />
              <input value={fullName} onChange={e => { setFullName(e.target.value); setErrors(p => ({...p, name: ""})); }}
                onFocus={() => setNameFocus(true)} onBlur={() => setNameFocus(false)}
                placeholder="John Doe" style={inputField} />
            </div>
            {errText(errors.name)}
          </div>

          {/* Company Email */}
          <div style={{ marginBottom: fs(18) }}>
            <label style={{ display: "block", fontSize: fs(13), fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>
              Company Email
            </label>
            <div style={inputWrap(emailFocus, !!errors.email)}>
              <MailIcon />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ""})); }}
                onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)}
                placeholder="john@company.com" style={inputField} />
            </div>
            {errText(errors.email)}
          </div>

          {/* Password + Confirm */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: fs(16), marginBottom: fs(18) }}>
            <div>
              <label style={{ display: "block", fontSize: fs(13), fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>
                Password
              </label>
              <div style={inputWrap(passFocus, !!errors.password)}>
                <LockIcon />
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: ""})); }}
                  onFocus={() => setPassFocus(true)} onBlur={() => setPassFocus(false)}
                  placeholder="••••••••" style={inputField} />
              </div>
              {errText(errors.password)}
            </div>
            <div>
              <label style={{ display: "block", fontSize: fs(13), fontWeight: 700, color: "#444", marginBottom: 7, letterSpacing: "0.03em" }}>
                Confirm Password
              </label>
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
          <div style={{ marginBottom: fs(24) }}>
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
              <span style={{ fontSize: fs(13), color: "#666", lineHeight: 1.6 }}>
                By creating an account, you agree to our{" "}
                <span style={{ color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>
                {" "}and{" "}
                <span style={{ color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>.
              </span>
            </label>
            {errText(errors.agreed)}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: "100%", padding: `${fs(16)}px 0`,
              background: loading ? "#f97316" : "#ea580c",
              color: "#fff", border: "none", borderRadius: fs(12),
              fontSize: fs(16), fontWeight: 700, letterSpacing: "0.04em",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              boxShadow: "0 6px 24px rgba(234,88,12,0.28)",
              transition: "background 0.18s, transform 0.1s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#c2410c"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#ea580c"; }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={e   => { e.currentTarget.style.transform = "scale(1)"; }}>
            {loading
              ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "btSpin 0.7s linear infinite" }} /> Creating account...</>
              : <>Create Account →</>
            }
          </button>

        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: fs(28) }}>
          <p style={{ margin: "0 0 10px", fontSize: fs(13), color: "#888" }}>
            Already have an account?{" "}
            <span style={{ color: "#ea580c", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>Log in</span>
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: fs(11), color: "#ccc" }}>
            <span style={{ cursor: "pointer" }}>Privacy policy</span>
            <span>•</span>
            <span style={{ cursor: "pointer" }}>Terms of service</span>
            <span>•</span>
            <span style={{ cursor: "pointer" }}>Support</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Root ── */
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: "#fff" }}>

      {/* Top nav */}
      <nav style={{ flexShrink: 0, height: 60, background: "#fff", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={34} />
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>BuildTrack</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 14, color: "#888", display: isMobile ? "none" : "inline" }}>Already have an account?</span>
          <button onClick={() => navigate("/login")} style={{ padding: "8px 18px", background: "#fff5f0", color: "#ea580c", border: "1.5px solid #ea580c", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Log In
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: isDesktop ? "row" : "column", overflow: isDesktop ? "hidden" : "auto", minHeight: 0 }}>
        {BrandPanel}
        {FormPanel}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, height: 44, background: "#f7f7f8", borderTop: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#bbb" }}>© 2024 BuildTrack Inc. All rights reserved. Built for construction excellence.</span>
      </div>
    </div>
  );
}