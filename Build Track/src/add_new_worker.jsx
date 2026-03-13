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

const trades = [
  "Select Trade", "Mason", "Carpenter", "Electrician", "Plumber",
  "Welder", "Painter", "General Labor", "Site Engineer", "Supervisor",
];

const paymentCycles = ["Weekly", "Bi-Weekly", "Monthly"];
const statusOptions = ["Active", "Inactive", "On Leave"];

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

export default function AddNewWorkerPage() {
  const [activeNav,   setActiveNav]   = useState("Workers");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);

  const [fullName,     setFullName]     = useState("");
  const [trade,        setTrade]        = useState("Select Trade");
  const [mobile,       setMobile]       = useState("");
  const [joiningDate,  setJoiningDate]  = useState("");
  const [status,       setStatus]       = useState("Active");
  const [dailyWage,    setDailyWage]    = useState("800");
  const [paymentCycle, setPaymentCycle] = useState("Weekly");
  const [dragOver,     setDragOver]     = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

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
    background: "#fff", border: "1px solid #e5e5e5",
    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
    outline: "none", fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: "#444",
    marginBottom: 7, display: "block",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none", cursor: "pointer", background: "#fff",
  };

  const sectionCard = {
    background: "#fff", borderRadius: 16,
    border: "1px solid #ebebeb", padding: "22px 24px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
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
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0, alignSelf: "flex-start" }}>☰</button>
            )}
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888", marginBottom: 2 }}>
              <span style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}>← Worker Directory</span>
              <span>/</span>
              <span style={{ color: "#555" }}>Add New Worker</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Add New Worker</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "10px 20px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#555", cursor: "pointer" }}>
              Cancel
            </button>
            <button style={{ padding: "10px 22px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(234,88,12,0.3)" }}>
              Save Worker
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap: 16, maxWidth: 1100, margin: "0 auto" }}>

            {/* ── Left Column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Profile Photo */}
              <div style={sectionCard}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 18 }}>Profile Photo</div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    border: `2px dashed ${dragOver ? "#ea580c" : "#d1d5db"}`,
                    background: photoPreview ? "transparent" : "#f9fafb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", transition: "all 0.2s", cursor: "pointer",
                  }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#fff5f0", border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📷</div>
                        </div>
                    }
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>Upload worker photo</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>JPG, PNG or WEBP. Max 2MB.</div>
                  </div>
                  <label style={{
                    width: "100%", padding: "10px 0", textAlign: "center",
                    border: "1px solid #ea580c", borderRadius: 10,
                    color: "#ea580c", fontWeight: 600, fontSize: 14,
                    cursor: "pointer", background: "#fff5f0",
                  }}>
                    Choose File
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) setPhotoPreview(URL.createObjectURL(file));
                      }} />
                  </label>
                </div>
              </div>

              {/* Worker Status */}
              <div style={sectionCard}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 16 }}>Worker Status</div>
                <label style={labelStyle}>Current Status</label>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                    {statusOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                </div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.5 }}>New workers are set to 'Active' by default upon registration.</span>
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Personal Information */}
              <div style={sectionCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Personal Information</span>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar" style={inputStyle} />
                </div>

                {/* Role + Worker ID */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Role / Trade</label>
                    <div style={{ position: "relative" }}>
                      <select value={trade} onChange={e => setTrade(e.target.value)} style={selectStyle}>
                        {trades.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Worker ID</label>
                    <input value="BT-2024-089" readOnly
                      style={{ ...inputStyle, background: "#f9f9f9", color: "#aaa", cursor: "default" }} />
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>Auto-generated system ID</div>
                  </div>
                </div>

                {/* Mobile + Joining Date */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Mobile Number</label>
                    <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "11px 12px", background: "#f9f9f9", borderRight: "1px solid #e5e5e5", fontSize: 13, color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>+91</div>
                      <input value={mobile} onChange={e => setMobile(e.target.value)}
                        placeholder="98765 43210"
                        style={{ flex: 1, border: "none", outline: "none", padding: "11px 14px", fontSize: 14, color: "#1a1a1a", fontFamily: "'Segoe UI', sans-serif", background: "transparent" }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Joining Date</label>
                    <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)}
                      style={{ ...inputStyle, color: joiningDate ? "#1a1a1a" : "#aaa" }} />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div style={sectionCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 18 }}>💳</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Payment Details</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Daily Wage / Rate (₹)</label>
                    <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "#ea580c", fontWeight: 700 }}>₹</span>
                      <input value={dailyWage} onChange={e => setDailyWage(e.target.value)}
                        placeholder="800"
                        style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontFamily: "'Segoe UI', sans-serif" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>Average market rate for this role is ₹600 - ₹900</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Payment Cycle</label>
                    <div style={{ position: "relative" }}>
                      <select value={paymentCycle} onChange={e => setPaymentCycle(e.target.value)} style={selectStyle}>
                        {paymentCycles.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Documents */}
              <div style={{ ...sectionCard, border: "1px dashed #d1d5db", background: "#fafafa" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>Additional Documents</div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Upload Aadhar Card, PAN, or certifications (Optional)</div>
                    <button style={{ padding: "8px 18px", background: "#fff", border: "1px solid #ea580c", borderRadius: 8, color: "#ea580c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      + Add Document
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ maxWidth: 1100, margin: "16px auto 0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button style={{ padding: "12px 28px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#555", cursor: "pointer" }}>
              Discard Changes
            </button>
            <button style={{ padding: "12px 28px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(234,88,12,0.3)" }}>
              Save Worker Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}