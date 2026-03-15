import { useState, useEffect, useRef } from "react";

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
  const profileInputRef = useRef(null);

  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const [profileImage, setProfileImage] = useState(null);
  const [fullName,     setFullName]     = useState("Rajesh Kumar");
  const [email,        setEmail]        = useState("rajesh.k@buildtrack.in");
  const [role,         setRole]         = useState("Site Supervisor");
  const [language,     setLanguage]     = useState("English");
  const [currency,     setCurrency]     = useState("Indian Rupee (INR)");
  const [emailNotif,   setEmailNotif]   = useState(true);
  const [pushNotif,    setPushNotif]    = useState(false);
  const [twoFA,        setTwoFA]        = useState(false);
  const [saved,        setSaved]        = useState(false);     // ← NEW

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  // ── Save profile with visual feedback ── ← NEW
  const handleSaveProfile = () => {
    if (!fullName.trim() || !email.trim()) {
      alert("Name and email cannot be empty.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOutAll    = () => alert("All devices signed out.");
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (confirmed) alert("Account deleted (demo).");
  };

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
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8",
    }}>

      {/* Top Bar */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        gap: 12, flexShrink: 0,
      }}>
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
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "#f0e6d3", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, border: "3px solid #f0f0f0",
                }}>
                  {profileImage
                    ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : "👷"
                  }
                </div>
                <div
                  onClick={() => profileInputRef.current.click()}
                  style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#ea580c", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 12, cursor: "pointer", border: "2px solid #fff",
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

                {/* ── Edit Profile button — turns green on save ── */}
                <button
                  onClick={handleSaveProfile}
                  style={{
                    padding: "11px 24px",
                    background: saved ? "#16a34a" : "#ea580c",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                    boxShadow: saved
                      ? "0 4px 12px rgba(22,163,74,0.3)"
                      : "0 4px 12px rgba(234,88,12,0.3)",
                    transition: "background 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  {saved ? "✓ Profile Saved!" : "Edit Profile Details"}
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Email Notifications</div>
                <div style={{ fontSize: 13, color: "#888" }}>Receive daily reports and project updates via email</div>
              </div>
              <Toggle on={emailNotif} onToggle={() => setEmailNotif(v => !v)} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Account Password</div>
                <div style={{ fontSize: 13, color: "#888" }}>Last changed 3 months ago</div>
              </div>
              <button
                onClick={() => alert("Password change feature coming soon.")}
                style={{
                  padding: "10px 18px", background: "#fff",
                  border: "1px solid #e5e5e5", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#444", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                🔒 Change Password
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 13, color: "#888" }}>Add an extra layer of security to your account</div>
              </div>
              <button
                onClick={() => setTwoFA(v => !v)}
                style={{
                  padding: "10px 18px",
                  background: twoFA ? "#fff" : "#ea580c",
                  border: twoFA ? "1px solid #e5e5e5" : "none",
                  borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: twoFA ? "#444" : "#fff",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: twoFA ? "none" : "0 4px 12px rgba(234,88,12,0.25)",
                  transition: "all 0.25s ease",
                }}
              >
                🛡️ {twoFA ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Active Sessions</div>
                <div style={{ fontSize: 13, color: "#888" }}>2 devices currently logged in</div>
              </div>
              <button
                onClick={handleSignOutAll}
                style={{
                  padding: "10px 18px", background: "#fff",
                  border: "1px solid #e5e5e5", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#dc2626",
                }}
              >
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
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: "10px 20px", background: "#fff",
                  border: "1.5px solid #dc2626", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#dc2626", whiteSpace: "nowrap",
                }}
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}