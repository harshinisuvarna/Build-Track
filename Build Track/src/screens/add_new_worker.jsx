import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const trades        = ["Select Trade", "Mason", "Carpenter", "Electrician", "Plumber", "Welder", "Painter", "General Labor", "Site Engineer", "Supervisor"];
const paymentCycles = ["Weekly", "Bi-Weekly", "Monthly"];
const statusOptions = ["Active", "Inactive", "On Leave"];

const TOPBAR_H = 72;

export default function AddNewWorkerPage() {
  const navigate = useNavigate();
  const location = useLocation();                                    // ← NEW

  // ── Detect edit mode from route state passed by worker_list.jsx ── ← NEW
  const editWorker = location.state?.editWorker || null;
  const isEditMode = Boolean(editWorker);

  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const [fullName,     setFullName]     = useState("");
  const [trade,        setTrade]        = useState("Select Trade");
  const [mobile,       setMobile]       = useState("");
  const [joiningDate,  setJoiningDate]  = useState("");
  const [status,       setStatus]       = useState("Active");
  const [dailyWage,    setDailyWage]    = useState("800");
  const [paymentCycle, setPaymentCycle] = useState("Weekly");
  const [dragOver,     setDragOver]     = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [documents,    setDocuments]    = useState([]);

  const docInputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Pre-fill form when in edit mode ── ← NEW
  useEffect(() => {
    if (!isEditMode) return;

    // Map worker list fields to form fields
    setFullName(editWorker.name || "");

    // Map role from worker list to trade dropdown — use exact match or fall back to first option
    const matchedTrade = trades.find(t => t.toLowerCase() === editWorker.role?.toLowerCase());
    setTrade(matchedTrade || "Select Trade");

    // Extract numeric wage value from formatted string e.g. "₹4,500.00" → "4500"
    const rawWage = editWorker.wages
      ? editWorker.wages.replace(/[₹,]/g, "").trim()
      : "800";
    setDailyWage(rawWage);

    // Map status — "Active" / "Inactive" map directly; "On Leave" is a third option
    const matchedStatus = statusOptions.find(s => s.toLowerCase() === editWorker.status?.toLowerCase());
    setStatus(matchedStatus || "Active");

    // mobile, joiningDate, paymentCycle not available in worker list data — leave as defaults
  }, [isEditMode]);                                                  // ← run once on mount

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocuments(prev => [...prev, file]);
      e.target.value = "";
    }
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

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
    appearance: "none", cursor: "pointer",
  };

  const sectionCard = {
    background: "#fff", borderRadius: 16,
    border: "1px solid #ebebeb", padding: "22px 24px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  };

  const docIcon = (name) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.match(/\.(jpg|jpeg|png)$/i)) return "🖼️";
    return "📎";
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", height: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8", overflow: "hidden",
    }}>

      {/* Top Bar */}
      <div style={{
        height: TOPBAR_H, flexShrink: 0,
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
            <span
              onClick={() => navigate("/workers")}
              style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}
            >
              ← Worker Directory
            </span>
            <span>/</span>
            {/* ── Breadcrumb label changes based on mode ── ← NEW */}
            <span style={{ color: "#555" }}>{isEditMode ? "Edit Worker" : "Add New Worker"}</span>
          </div>
          {/* ── Page title changes based on mode ── ← NEW */}
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>
            {isEditMode ? `Edit Worker — ${editWorker.name}` : "Add New Worker"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/workers")}
            style={{ padding: "10px 20px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#555", cursor: "pointer" }}
          >
            Cancel
          </button>
          {/* ── Save button label changes based on mode ── ← NEW */}
          <button style={{ padding: "10px 22px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(234,88,12,0.3)" }}>
            {isEditMode ? "Update Worker" : "Save Worker"}
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        padding: "20px 24px 60px", boxSizing: "border-box",
      }}>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "340px 1fr",
          gap: 16, maxWidth: 1100, margin: "0 auto",
        }}>

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
                    : <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#fff5f0", border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📷</div>
                  }
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>Upload worker photo</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>JPG, PNG or WEBP. Max 2MB.</div>
                </div>
                <label style={{ width: "100%", padding: "10px 0", textAlign: "center", border: "1px solid #ea580c", borderRadius: 10, color: "#ea580c", fontWeight: 600, fontSize: 14, cursor: "pointer", background: "#fff5f0", boxSizing: "border-box" }}>
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
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar" style={inputStyle} />
              </div>
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
                  {/* ── Show actual worker ID in edit mode ── ← NEW */}
                  <input
                    value={isEditMode ? editWorker.id.replace("#", "") : "BT-2024-089"}
                    readOnly
                    style={{ ...inputStyle, background: "#f9f9f9", color: "#aaa", cursor: "default" }}
                  />
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>
                    {isEditMode ? "Existing worker ID" : "Auto-generated system ID"}
                  </div>
                </div>
              </div>
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
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={handleDocumentUpload}
              />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>Additional Documents</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Upload Aadhar Card, PAN, or certifications (Optional)</div>
                  {documents.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {documents.map((doc, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, padding: "8px 12px" }}>
                          <span style={{ fontSize: 16 }}>{docIcon(doc.name)}</span>
                          <span style={{ flex: 1, fontSize: 13, color: "#333", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                          <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{(doc.size / 1024).toFixed(1)} KB</span>
                          <button onClick={() => removeDocument(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#aaa", padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => docInputRef.current.click()}
                    style={{ padding: "8px 18px", background: "#fff", border: "1px solid #ea580c", borderRadius: 8, color: "#ea580c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    + Add Document
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Action Bar */}
        <div style={{ maxWidth: 1100, margin: "16px auto 0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            onClick={() => navigate("/workers")}
            style={{ padding: "12px 28px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#555", cursor: "pointer" }}
          >
            Discard Changes
          </button>
          {/* ── Bottom save button label also changes ── ← NEW */}
          <button style={{ padding: "12px 28px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(234,88,12,0.3)" }}>
            {isEditMode ? "Update Worker Profile" : "Save Worker Profile"}
          </button>
        </div>

      </div>
    </div>
  );
}