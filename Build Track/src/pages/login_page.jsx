import { useState, useEffect, useRef } from "react";

/* ── Icons ── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

/* ── Feature list for desktop panel ── */
const features = [
  { icon: "📊", title: "Real-time dashboards",    desc: "Track every project metric live" },
  { icon: "👷", title: "Worker management",       desc: "Manage teams across all sites"   },
  { icon: "💰", title: "Financial reporting",     desc: "Budgets, wages & profit margins"  },
  { icon: "📍", title: "Site tracking",           desc: "Monitor progress on every site"  },
];

export default function LoginPage() {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [shake,      setShake]      = useState(false);
  const [emailErr,   setEmailErr]   = useState("");
  const [passErr,    setPassErr]    = useState("");
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus,  setPassFocus]  = useState(false);
  const [vw,         setVw]         = useState(window.innerWidth);
  const [vh,         setVh]         = useState(window.innerHeight);

  /* ── Responsive viewport tracking ── */
  useEffect(() => {
    const update = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);

  const isMobile  = vw < 640;
  const isTablet  = vw >= 640 && vw < 1024;
  const isDesktop = vw >= 1024;

  /* ── Fluid font scale ── */
  const scale = Math.min(Math.max(vw / 1440, 0.65), 1.2);
  const fs = (base) => Math.round(base * scale);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleLogin = () => {
    let valid = true;
    if (!validateEmail(email)) { setEmailErr("Please enter a valid email address."); valid = false; }
    if (password.length < 6)   { setPassErr("Password must be at least 6 characters."); valid = false; }
    if (!valid) { setShake(true); setTimeout(() => setShake(false), 420); return; }
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  };

  /* ── Enter key support ── */
  useEffect(() => {
    const h = (e) => { if (e.key === "Enter") handleLogin(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [email, password]);

  const inputStyle = (focused, hasErr) => ({
    width: "100%",
    padding: `${fs(14)}px ${fs(16)}px`,
    border: `1.5px solid ${hasErr ? "#dc2626" : focused ? "#ea580c" : "#e5e5e5"}`,
    borderRadius: fs(12),
    fontSize: fs(15),
    color: "#1a1a1a",
    background: "#fff",
    outline: "none",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxShadow: focused ? `0 0 0 3px ${hasErr ? "rgba(220,38,38,0.12)" : "rgba(234,88,12,0.12)"}` : "none",
  });

  /* ── Right panel (form) ── */
  const FormPanel = (
    <div style={{
      width: "100%",
      maxWidth: isDesktop ? 480 : isTablet ? 420 : "100%",
      display: "flex", flexDirection: "column",
      justifyContent: "center",
      padding: isDesktop ? `${fs(48)}px ${fs(56)}px` : isTablet ? `${fs(40)}px ${fs(40)}px` : `${fs(32)}px ${fs(24)}px`,
      boxSizing: "border-box",
      minHeight: isDesktop ? "100vh" : "auto",
      overflowY: "auto",
    }}>

      {/* Logo (shown on mobile/tablet only — desktop has it in left panel) */}
      {!isDesktop && (
        <div style={{ textAlign: "center", marginBottom: fs(32) }}>
          <div style={{ fontSize: fs(42), fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 8 }}>
            <span style={{ color: "#1a1a2e" }}>Build</span>
            <span style={{ color: "#ea580c" }}>Track</span>
          </div>
          <p style={{ margin: 0, fontSize: fs(14), color: "#888", letterSpacing: "0.02em" }}>
            Manage your projects seamlessly
          </p>
        </div>
      )}

      {/* Heading */}
      <div style={{ marginBottom: fs(28) }}>
        <h1 style={{ margin: "0 0 6px", fontSize: fs(26), fontWeight: 800, color: "#1a1a1a" }}>
          Welcome back
        </h1>
        <p style={{ margin: 0, fontSize: fs(14), color: "#888" }}>
          Sign in to your BuildTrack account
        </p>
      </div>

      {/* Form with shake */}
      <div style={{ animation: shake ? "btShake 0.42s ease" : "none" }}>
        <style>{`
          @keyframes btShake {
            0%,100%{transform:translateX(0)}
            20%,60%{transform:translateX(-7px)}
            40%,80%{transform:translateX(7px)}
          }
          @keyframes btSpin { to{transform:rotate(360deg)} }
          @keyframes btFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        {/* Email */}
        <div style={{ marginBottom: fs(16) }}>
          <label style={{ display: "block", fontSize: fs(13), fontWeight: 600, color: "#444", marginBottom: 6, letterSpacing: "0.02em" }}>
            EMAIL ADDRESS
          </label>
          <input
            type="email" value={email}
            onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
            placeholder="name@company.com"
            autoComplete="email"
            style={inputStyle(emailFocus, !!emailErr)}
          />
          {emailErr && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626", animation: "btFadeIn 0.2s ease" }}>{emailErr}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: fs(10) }}>
          <label style={{ display: "block", fontSize: fs(13), fontWeight: 600, color: "#444", marginBottom: 6, letterSpacing: "0.02em" }}>
            PASSWORD
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"} value={password}
              onChange={e => { setPassword(e.target.value); setPassErr(""); }}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ ...inputStyle(passFocus, !!passErr), paddingRight: fs(48) }}
            />
            <button onClick={() => setShowPass(v => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4, display: "flex", alignItems: "center", lineHeight: 0 }}>
              {showPass ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
          {passErr && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626", animation: "btFadeIn 0.2s ease" }}>{passErr}</p>}
        </div>

        {/* Forgot */}
        <div style={{ textAlign: "right", marginBottom: fs(24) }}>
          <span style={{ fontSize: fs(13), color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>
            Forgot password?
          </span>
        </div>

        {/* Login Button */}
        <button onClick={handleLogin} disabled={loading}
          style={{
            width: "100%", padding: `${fs(16)}px 0`,
            background: loading ? "#f97316" : "#ea580c",
            color: "#fff", border: "none", borderRadius: fs(12),
            fontSize: fs(15), fontWeight: 700, letterSpacing: "0.08em",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            boxShadow: "0 6px 24px rgba(234,88,12,0.28)",
            transition: "background 0.18s, transform 0.1s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#c2410c"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#ea580c"; }}
          onMouseDown={e  => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={e    => { e.currentTarget.style.transform = "scale(1)"; }}>
          {loading && (
            <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "btSpin 0.7s linear infinite" }} />
          )}
          {loading ? "Signing in..." : "SIGN IN"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: `${fs(20)}px 0` }}>
          <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
          <span style={{ fontSize: fs(12), color: "#bbb", whiteSpace: "nowrap" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
        </div>

        {/* Social */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: fs(28) }}>
          {[{ label: "Google", Icon: GoogleIcon }, { label: "GitHub", Icon: GitHubIcon }].map(({ label, Icon }) => (
            <button key={label}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: `${fs(11)}px ${fs(14)}px`,
                border: "1px solid #e5e5e5", borderRadius: fs(10),
                background: "#fff", color: "#333",
                fontSize: fs(13), fontWeight: 600,
                cursor: "pointer", fontFamily: "'Segoe UI', system-ui, sans-serif",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f9f9f9"; e.currentTarget.style.borderColor = "#d5d5d5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff";    e.currentTarget.style.borderColor = "#e5e5e5"; }}>
              <Icon /> {label}
            </button>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 10px", fontSize: fs(13), color: "#888" }}>
            Don't have an account?{" "}
            <span style={{ color: "#ea580c", fontWeight: 700, cursor: "pointer" }}>Sign up free</span>
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

  /* ── Left panel (desktop only) ── */
  const BrandPanel = (
    <div style={{
      flex: 1,
      background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "flex-start",
      padding: `${fs(56)}px ${fs(64)}px`,
      position: "relative", overflow: "hidden",
      minHeight: "100vh",
    }}>

      {/* Background decoration */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(234,88,12,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(234,88,12,0.06)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ marginBottom: fs(48) }}>
        <div style={{ fontSize: fs(48), fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, marginBottom: 10 }}>
          <span style={{ color: "#fff" }}>Build</span>
          <span style={{ color: "#ea580c" }}>Track</span>
        </div>
        <p style={{ margin: 0, fontSize: fs(15), color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
          Construction management platform
        </p>
      </div>

      {/* Headline */}
      <h2 style={{ margin: "0 0 12px", fontSize: fs(34), fontWeight: 800, color: "#fff", lineHeight: 1.2, maxWidth: 420 }}>
        Build smarter.<br />
        <span style={{ color: "#ea580c" }}>Track everything.</span>
      </h2>
      <p style={{ margin: `0 0 ${fs(48)}px`, fontSize: fs(15), color: "rgba(255,255,255,0.55)", maxWidth: 380, lineHeight: 1.7 }}>
        From site management to financial reporting — everything your construction team needs in one place.
      </p>

      {/* Feature list */}
      <div style={{ display: "flex", flexDirection: "column", gap: fs(18), width: "100%" }}>
        {features.map((f) => (
          <div key={f.title} style={{ display: "flex", alignItems: "center", gap: fs(14) }}>
            <div style={{ width: fs(40), height: fs(40), borderRadius: fs(10), background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs(18), flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: fs(14), fontWeight: 700, color: "#fff", marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: fs(12), color: "rgba(255,255,255,0.45)" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div style={{ display: "flex", gap: fs(32), marginTop: fs(56) }}>
        {[["500+", "Projects"], ["12K+", "Workers"], ["98%", "Uptime"]].map(([val, label]) => (
          <div key={label}>
            <div style={{ fontSize: fs(22), fontWeight: 800, color: "#ea580c" }}>{val}</div>
            <div style={{ fontSize: fs(11), color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Root layout ── */
  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex",
      flexDirection: isDesktop ? "row" : "column",
      overflow: isDesktop ? "hidden" : "auto",
      background: "#fff",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>

      {/* Desktop: brand left + form right */}
      {isDesktop && (
        <>
          {BrandPanel}
          <div style={{ width: 520, flexShrink: 0, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {FormPanel}
          </div>
        </>
      )}

      {/* Tablet / Mobile: form only, centered */}
      {!isDesktop && (
        <div style={{ flex: 1, display: "flex", alignItems: isTablet ? "center" : "flex-start", justifyContent: "center", minHeight: "100vh", padding: isMobile ? 0 : "24px" }}>
          <div style={{ width: "100%", maxWidth: isTablet ? 480 : "100%" }}>
            {FormPanel}
          </div>
        </div>
      )}

    </div>
  );
}