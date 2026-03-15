// pages/NewProjectPage.jsx
import { useState, useEffect } from "react";

const managers = [
  "Select Manager",
  "Rajesh Kumar",
  "Ananya Singh",
  "David Wilson",
  "Vikram Roy",
  "Emma W.",
];

const TOPBAR_H = 65;

// FIX 1: accept onNavigate from App.jsx
export default function NewProjectPage({ onNavigate = () => {} }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // FIX 2: lazy initialiser — SSR safe
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth < 768);

  const [projectName, setProjectName] = useState("");
  const [location,    setLocation]    = useState("");
  const [manager,     setManager]     = useState("Select Manager");
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
    <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8", overflow: "hidden", position: "relative" }}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{
          height: TOPBAR_H, flexShrink: 0,
          background: "#fff", borderBottom: "1px solid #ebebeb",
          padding: "0 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
          overflow: "hidden",   // FIX 4: topbar overflow guard
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0, flexShrink: 0 }}>☰</button>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>Project Management</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Create and manage your construction projects</p>
            </div>
          </div>
          {/* FIX 5: "Back" button calls onNavigate instead of doing nothing */}
          <button
            onClick={() => onNavigate("Projects")}
            style={{ padding: "9px 18px", background: "#fff", color: "#555", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
            ← Back to Projects
          </button>
        </div>  

        {/* Scrollable Body */}
        <div style={{ height: `calc(100vh - ${TOPBAR_H}px)`, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "24px 24px 60px", boxSizing: "border-box" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#888" }}>
            {/* FIX 6: breadcrumb link is functional */}
            <span
              onClick={() => onNavigate("Projects")}
              style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}>
              Projects
            </span>
            <span>›</span>
            <span style={{ color: "#444", fontWeight: 500 }}>Create New Project</span>
          </div>

          {/* Form Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px 32px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", maxWidth: 860, margin: "0 auto" }}>

            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Project Information</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Initialize your construction project by providing core details and tracking parameters.</p>
            </div>

            {/* Project Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Project Name</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Skyline Residency Phase 1" style={inputStyle} />
            </div>

            {/* Site Location + Assigned Manager */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Site Location</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa" }}>📍</span>
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Mumbai, MH"
                    style={{ ...inputStyle, paddingLeft: 34 }} />
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
                  <input value={budget} onChange={e => setBudget(e.target.value)}
                    placeholder="5,00,00,000"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontFamily: "'Segoe UI', sans-serif" }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Start Date</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa", pointerEvents: "none" }}>📅</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 34, color: startDate ? "#1a1a1a" : "#aaa" }} />
                </div>
              </div>
            </div>

            {/* Site Photo */}
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
              <textarea value={scope} onChange={e => setScope(e.target.value)}
                placeholder="Describe the primary objectives and key milestones of the project..."
                rows={5}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <button style={{
                padding: "14px 0", background: "#ea580c", color: "#fff",
                border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(234,88,12,0.3)",
              }}>
                💾 Create Project
              </button>
              {/* FIX 7: Cancel navigates back instead of doing nothing */}
              <button
                onClick={() => onNavigate("Projects")}
                style={{
                  padding: "14px 0", background: "#fff", color: "#555",
                  border: "1px solid #e5e5e5", borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: "pointer",
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