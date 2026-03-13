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

const managers = [
  "Select Manager",
  "Rajesh Kumar",
  "Ananya Singh",
  "David Wilson",
  "Vikram Roy",
  "Emma W.",
];

/* ── BuildTrack Logo Icon ── */
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

export default function NewProjectPage() {
  const [activeNav,   setActiveNav]   = useState("Projects");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);

  const [projectName, setProjectName] = useState("");
  const [location,    setLocation]    = useState("");
  const [manager,     setManager]     = useState("");
  const [budget,      setBudget]      = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [scope,       setScope]       = useState("");
  const [dragOver,    setDragOver]    = useState(false);

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
    fontSize: 13, fontWeight: 600, color: "#444",
    marginBottom: 8, display: "block",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none", cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8", overflow: "hidden" }}>

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
              <div style={{ fontSize: 10, color: "#999", letterSpacing: "0.1em", fontWeight: 600 }}>MANAGEMENT</div>
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
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fdba74", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Alex Foreman</div>
              <div style={{ fontSize: 11, color: "#888" }}>Admin Account</div>
            </div>
          </div>
          <span style={{ color: "#aaa", fontSize: 16, cursor: "pointer" }}>⋮</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Project Management</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Create and manage your construction projects</p>
            </div>
          </div>
          <button style={{ padding: "9px 18px", background: "#fff", color: "#555", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            ← Back to Projects
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#888" }}>
            <span style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}>Projects</span>
            <span>›</span>
            <span style={{ color: "#444", fontWeight: 500 }}>Create New Project</span>
          </div>

          {/* Form Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px 32px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", maxWidth: 860, margin: "0 auto" }}>

            {/* Form Title */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Project Information</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Initialize your construction project by providing core details and tracking parameters.</p>
            </div>

            {/* Project Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Project Name</label>
              <input
                value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Skyline Residency Phase 1"
                style={inputStyle}
              />
            </div>

            {/* Site Location + Assigned Manager */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Site Location</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa" }}>📍</span>
                  <input
                    value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Mumbai, MH"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Assigned Manager</label>
                <div style={{ position: "relative" }}>
                  <select value={manager} onChange={e => setManager(e.target.value)} style={selectStyle}>
                    {managers.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                </div>
              </div>
            </div>

            {/* Total Budget + Start Date */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Total Budget (₹)</label>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "#ea580c", fontWeight: 600 }}>₹</span>
                  <input
                    value={budget} onChange={e => setBudget(e.target.value)}
                    placeholder="5,00,00,000"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontFamily: "'Segoe UI', sans-serif" }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Start Date</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa", pointerEvents: "none" }}>📅</span>
                  <input
                    type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 34, color: startDate ? "#1a1a1a" : "#aaa" }}
                  />
                </div>
              </div>
            </div>

            {/* Site Photo Upload */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Site Photo</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); }}
                style={{
                  border: `2px dashed ${dragOver ? "#ea580c" : "#e5e5e5"}`,
                  borderRadius: 12, padding: "36px 20px",
                  background: dragOver ? "#fff5f0" : "#fafafa",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff5f0", border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📷</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Click to upload or drag and drop</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>PNG, JPG, GIF up to 10MB</div>
                </div>
              </div>
            </div>

            {/* Project Scope */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Project Scope</label>
              <textarea
                value={scope} onChange={e => setScope(e.target.value)}
                placeholder="Describe the primary objectives and key milestones of the project..."
                rows={5}
                style={{
                  ...inputStyle,
                  resize: "vertical", lineHeight: 1.6,
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <button style={{
                padding: "14px 0", background: "#ea580c", color: "#fff",
                border: "none", borderRadius: 12, fontWeight: 700,
                fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(234,88,12,0.3)",
              }}>
                💾 Create Project
              </button>
              <button style={{
                padding: "14px 0", background: "#fff", color: "#555",
                border: "1px solid #e5e5e5", borderRadius: 12,
                fontWeight: 600, fontSize: 15, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}