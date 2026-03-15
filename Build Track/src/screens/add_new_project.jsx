import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const managers = [
  "Select Manager",
  "Rajesh Kumar",
  "Ananya Singh",
  "David Wilson",
  "Vikram Roy",
  "Emma W.",
];

const TOPBAR_H = 65;

export default function NewProjectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);                         // ← NEW

  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768);
  const [projectName,  setProjectName]  = useState("");
  const [location,     setLocation]     = useState("");
  const [manager,      setManager]      = useState("Select Manager");
  const [budget,       setBudget]       = useState("");
  const [startDate,    setStartDate]    = useState("");
  const [scope,        setScope]        = useState("");
  const [dragOver,     setDragOver]     = useState(false);
  const [sitePhoto,    setSitePhoto]    = useState(null);    // ← NEW: stores uploaded file preview

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Handle file selected from input or drop ── ← NEW
  const handlePhotoFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSitePhoto(URL.createObjectURL(file));
    }
  };

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8",
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: TOPBAR_H, flexShrink: 0,
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>Project Management</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Create and manage your construction projects</p>
        </div>
        <button
          onClick={() => navigate("/projects")}
          style={{
            padding: "9px 18px", background: "#fff", color: "#555",
            border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600,
            fontSize: 13, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          ← Back to Projects
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div style={{
        flex: 1,
        overflowY: "auto", overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        padding: "24px 24px 60px",
        boxSizing: "border-box",
      }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#888" }}>
          <span
            onClick={() => navigate("/projects")}
            style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}
          >
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

          {/* ── Site Photo — now clickable + drag-drop works ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Site Photo</label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/gif"
              style={{ display: "none" }}
              onChange={e => handlePhotoFile(e.target.files[0])}
            />

            <div
              onClick={() => fileInputRef.current.click()}          // ← click opens picker
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handlePhotoFile(e.dataTransfer.files[0]);           // ← drop works
              }}
              style={{
                border: `2px dashed ${dragOver ? "#ea580c" : "#e5e5e5"}`,
                borderRadius: 12, padding: sitePhoto ? 0 : "36px 20px",
                background: dragOver ? "#fff5f0" : "#fafafa",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                cursor: "pointer", transition: "all 0.2s",
                overflow: "hidden", minHeight: 140,
                justifyContent: "center",
              }}
            >
              {sitePhoto ? (
                /* Preview uploaded image */
                <div style={{ position: "relative", width: "100%" }}>
                  <img
                    src={sitePhoto}
                    alt="Site preview"
                    style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block", borderRadius: 10 }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); setSitePhoto(null); }}
                    style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(0,0,0,0.55)", color: "#fff",
                      border: "none", borderRadius: 6, padding: "4px 10px",
                      fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff5f0", border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📷</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Click to upload or drag and drop</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>PNG, JPG, GIF up to 10MB</div>
                  </div>
                </>
              )}
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

          {/* ── Buttons ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <button
              onClick={() => {
                // Basic validation before saving
                if (!projectName.trim()) {
                  alert("Please enter a project name.");
                  return;
                }
                if (manager === "Select Manager") {
                  alert("Please select a manager.");
                  return;
                }
                // Navigate back to projects after save
                navigate("/projects");
              }}
              style={{
                padding: "14px 0", background: "#ea580c", color: "#fff",
                border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(234,88,12,0.3)",
              }}
            >
              💾 Create Project
            </button>
            <button
              onClick={() => navigate("/projects")}
              style={{
                padding: "14px 0", background: "#fff", color: "#555",
                border: "1px solid #e5e5e5", borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}