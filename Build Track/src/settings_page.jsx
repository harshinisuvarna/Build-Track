import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard", icon: "⊞" },
  { label: "Voice",     icon: "🎤" },
  { label: "Workers",   icon: "👥" },
  { label: "Log",       icon: "📋" },
  { label: "Projects",  icon: "💼" },
  { label: "Reports",   icon: "📊" },
  { label: "Settings",  icon: "⚙️" },
];

function LogoIcon({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(145deg, #f97316, #ea580c)",
      borderRadius: size * 0.25,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 8px rgba(234,88,12,0.35)",
      flexShrink: 0,
    }}>
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none">
        <rect x="6"  y="10" width="24" height="22" rx="2" fill="white" />
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

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle}
      style={{
        width: 48, height: 26, borderRadius: 13, cursor: "pointer",
        background: on ? "#ea580c" : "#d1d5db",
        position: "relative", transition: "background 0.25s ease",
        flexShrink: 0,
      }}>
      <div style={{
        position: "absolute", top: 3,
        left: on ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.25s ease",
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeNav,    setActiveNav]    = useState("Settings");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);

  // Profile
  const [fullName,     setFullName]     = useState("Rajesh Kumar");
  const [email,        setEmail]        = useState("rajesh.k@buildtrack.in");
  const [role,         setRole]         = useState("Site Supervisor");

  // Preferences
  const [language,     setLanguage]     = useState("English");
  const [currency,     setCurrency]     = useState("Indian Rupee (INR)");

  // Notifications
  const [emailNotif,   setEmailNotif]   = useState(true);
  const [pushNotif,    setPushNotif]    = useState(false);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "#f9f9f9", border: "1px solid #e5e5e5",
    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
    outline: "none", fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: "#aaa",
    letterSpacing: "0.06em", marginBottom: 8, display: "block",
  };

  const sectionCard = {
    background: "#fff", borderRadius: 16,
    border: "1px solid #ebebeb", padding: "28px 32px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 20,
  };

  const sectionTitle = {
    fontSize: 18, fontWeight: 700, color: "#1a1a1a",
    marginBottom: 24,
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8", overflow: "hidden" }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: 235, background: "#fff",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid #ebebeb", flexShrink: 0, zIndex: 50,
        position: isMobile ? "fixed" : "relative",
        top: 0, left: 0, bottom: 0, height: "100%",
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.3s ease", overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon size={38} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", lineHeight: 1.1 }}>BuildTrack</div>
              <div style={{ fontSize: 10, color: "#999", letterSpacing: "0.1em", fontWeight: 600 }}>CONSTRUCTION MGMT</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: "12px", flex: 1 }}>
          {navItems.map((item) => (
            <button key={item.label}
              onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: activeNav === item.label ? "#fff5f0" : "transparent",
                color:      activeNav === item.label ? "#ea580c" : "#555",
                fontWeight: activeNav === item.label ? 600 : 400,
                fontSize: 14, marginBottom: 2, transition: "all 0.15s", textAlign: "left",
              }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#fdba74", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>👤</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Rajesh Kumar</div>
            <div style={{ fontSize: 11, color: "#888" }}>Site Supervisor</div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Settings</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Manage your account preferences and security</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>

            {/* ── Profile Settings ── */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Profile Settings</div>

              <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: isMobile ? "wrap" : "nowrap" }}>

                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "#f0e6d3", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 40, border: "3px solid #f0f0f0",
                  }}>👷</div>
                  <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#ea580c", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 12, cursor: "pointer",
                    border: "2px solid #fff",
                  }}>✏️</div>
                </div>

                {/* Fields */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={labelStyle}>FULL NAME</label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>EMAIL ADDRESS</label>
                      <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>ROLE</label>
                    <input value={role} onChange={e => setRole(e.target.value)}
                      style={{ ...inputStyle, maxWidth: isMobile ? "100%" : "calc(50% - 8px)" }} />
                  </div>
                  <button style={{
                    padding: "11px 24px", background: "#ea580c", color: "#fff",
                    border: "none", borderRadius: 10, fontWeight: 600,
                    fontSize: 14, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(234,88,12,0.3)",
                  }}>
                    Edit Profile Details
                  </button>
                </div>
              </div>
            </div>

            {/* ── Preferences ── */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Preferences</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 13, color: "#444", fontWeight: 500, letterSpacing: 0 }}>Display Language</label>
                  <div style={{ position: "relative" }}>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Marathi</option>
                      <option>Tamil</option>
                    </select>
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 13, color: "#444", fontWeight: 500, letterSpacing: 0 }}>Currency Indicator</label>
                  <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 10 }}>
                    <span style={{ fontSize: 16, color: "#ea580c", fontWeight: 700 }}>₹</span>
                    <span style={{ fontSize: 14, color: "#1a1a1a" }}>{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Notifications ── */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Notifications</div>

              {/* Email Notifications */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0", borderBottom: "1px solid #f0f0f0",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Email Notifications</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Receive daily reports and project updates via email</div>
                </div>
                <Toggle on={emailNotif} onToggle={() => setEmailNotif(v => !v)} />
              </div>

              {/* Push Notifications */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Push Notifications</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Alerts for site issues and worker attendance</div>
                </div>
                <Toggle on={pushNotif} onToggle={() => setPushNotif(v => !v)} />
              </div>
            </div>

            {/* ── Security ── */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Security</div>

              {/* Account Password */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0", borderBottom: "1px solid #f0f0f0",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Account Password</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Last changed 3 months ago</div>
                </div>
                <button style={{
                  padding: "10px 18px", background: "#fff",
                  border: "1px solid #e5e5e5", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#444", display: "flex", alignItems: "center", gap: 8,
                }}>
                  🔒 Change Password
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0", borderBottom: "1px solid #f0f0f0",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Add an extra layer of security to your account</div>
                </div>
                <button style={{
                  padding: "10px 18px", background: "#ea580c",
                  border: "none", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#fff", display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 12px rgba(234,88,12,0.25)",
                }}>
                  🛡️ Enable 2FA
                </button>
              </div>

              {/* Active Sessions */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Active Sessions</div>
                  <div style={{ fontSize: 13, color: "#888" }}>2 devices currently logged in</div>
                </div>
                <button style={{
                  padding: "10px 18px", background: "#fff",
                  border: "1px solid #e5e5e5", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#dc2626",
                }}>
                  Sign Out All
                </button>
              </div>
            </div>

            {/* ── Danger Zone ── */}
            <div style={{ ...sectionCard, border: "1px solid #fee2e2", background: "#fff" }}>
              <div style={{ ...sectionTitle, color: "#dc2626" }}>Danger Zone</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Delete Account</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Permanently delete your account and all associated data. This action cannot be undone.</div>
                </div>
                <button style={{
                  padding: "10px 20px", background: "#fff",
                  border: "1.5px solid #dc2626", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#dc2626", whiteSpace: "nowrap",
                }}>
                  🗑️ Delete Account
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}