import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const transactionTypes = ["Wages", "Expense", "Income", "Materials"];
const workerOptions    = ["Select worker (Optional)", "Rahul Sharma", "Amit Kumar", "Suresh G.", "Ravi S.", "Priya K."];
const projectOptions   = ["Select project site", "Skyline Tower", "Green Valley", "City Center", "Ocean Front Estate"];

export default function ManualEntryPage() {
  const navigate = useNavigate();

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
    <div style={{
      display: "flex",
      width: "100%",       // ← was "100vw" — caused offset beside sidebar
      height: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8",
      overflow: "hidden",
      flex: 1,             // ← fills space beside sidebar
      minWidth: 0,         // ← prevents flex overflow
    }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

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
          {/* ✅ Navigates back to /voice */}
          <button
            onClick={() => navigate("/voice")}
            style={{
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
                {/* ✅ Cancel also goes back to /voice */}
                <button
                  onClick={() => navigate("/voice")}
                  style={{
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
                <strong style={{ color: "#ea580c" }}>Tip:</strong> Use{" "}
                {/* ✅ Tip link also goes back to /voice */}
                <span
                  onClick={() => navigate("/voice")}
                  style={{ color: "#ea580c", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
                  Voice Assistant
                </span>{" "}
                for even faster entry logging. Just say "Paid worker Amit 500 for cement work".
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}