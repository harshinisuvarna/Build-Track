import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard",       icon: "⊞" },
  { label: "Voice Assistant", icon: "🎤" },
  { label: "Workers",         icon: "👥" },
  { label: "Log",             icon: "📋" },
  { label: "Projects",        icon: "💼" },
  { label: "Reports",         icon: "📊" },
  { label: "Settings",        icon: "⚙️" },
];

const transactionTypes = ["Wages", "Expense", "Income", "Materials"];
const workerOptions    = ["Select worker (Optional)", "Rahul Sharma", "Amit Kumar", "Suresh G.", "Ravi S.", "Priya K."];
const projectOptions   = ["Select project site", "Skyline Tower", "Green Valley", "City Center", "Ocean Front Estate"];

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
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function ManualEntryPage() {
  const [activeNav,   setActiveNav]   = useState("Voice Assistant");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [txType,      setTxType]      = useState("");
  const [date,        setDate]        = useState("");
  const [worker,      setWorker]      = useState("");
  const [project,     setProject]     = useState("");
  const [amount,      setAmount]      = useState("");
  const [notes,       setNotes]       = useState("");

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selectStyle = {
    width: "100%", padding: "11px 14px",
    background: "#f9f9f9", border: "1px solid #e5e5e5",
    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
    fontWeight: 500, outline: "none",
    appearance: "none", cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#555",
    letterSpacing: "0.04em", marginBottom: 8,
    display: "flex", alignItems: "center", gap: 6,
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
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Manual Entry</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Log a transaction manually</p>
            </div>
          </div>
          <button style={{
            padding: "9px 18px", background: "#fff", color: "#555",
            border: "1px solid #e5e5e5", borderRadius: 10,
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
          }}>
            ← Back to Voice Assistant
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>

            {/* Form Card */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px 32px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 16 }}>

              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Log Transaction Details</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Please provide precise information for financial tracking.</p>
              </div>

              {/* Row 1: Transaction Type + Date */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={labelStyle}>👤 Transaction Type</div>
                  <div style={{ position: "relative" }}>
                    <select value={txType} onChange={e => setTxType(e.target.value)} style={selectStyle}>
                      <option value="">Select entry type</option>
                      {transactionTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>📅 Date</div>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ ...selectStyle, color: date ? "#1a1a1a" : "#aaa" }} />
                </div>
              </div>

              {/* Row 2: Worker + Project */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={labelStyle}>👤 Worker Name</div>
                  <div style={{ position: "relative" }}>
                    <select value={worker} onChange={e => setWorker(e.target.value)} style={selectStyle}>
                      {workerOptions.map(w => <option key={w}>{w}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>🏗️ Project</div>
                  <div style={{ position: "relative" }}>
                    <select value={project} onChange={e => setProject(e.target.value)} style={selectStyle}>
                      {projectOptions.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Amount */}
              <div style={{ marginBottom: 20 }}>
                <div style={labelStyle}>💰 Amount</div>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 8 }}>
                  <span style={{ fontSize: 15, color: "#ea580c", fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500, fontFamily: "'Segoe UI', sans-serif" }}
                  />
                </div>
              </div>

              {/* Row 4: Description / Notes */}
              <div style={{ marginBottom: 28 }}>
                <div style={labelStyle}>📝 Description / Notes</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter specific details about this transaction..."
                  rows={5}
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "#f9f9f9", border: "1px solid #e5e5e5",
                    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
                    fontFamily: "'Segoe UI', sans-serif", outline: "none",
                    resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
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
                  💾 Save Entry
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

            {/* Tip Banner */}
            <div style={{ background: "#fff9f5", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff5f0", border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💡</div>
              <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                <strong style={{ color: "#ea580c" }}>Tip:</strong> Use <span style={{ color: "#ea580c", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Voice Assistant</span> for even faster entry logging. Just say "Paid worker Amit 500 for cement work".
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}