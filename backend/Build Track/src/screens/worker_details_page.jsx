// src/screens/worker_details_page.jsx
// Receives worker data via react-router navigation state from financial_report.jsx

import { useLocation, useNavigate } from "react-router-dom";

export default function WorkerDetailsPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const worker     = state?.worker;

  // ── Guard: if landed directly without state, bounce back ─────────────────
  if (!worker) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Segoe UI', sans-serif", gap: 16 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, color: "#111" }}>No Worker Data Found</h2>
        <p style={{ color: "#888", margin: 0 }}>Please navigate here from the Financial Report page.</p>
        <button
          onClick={() => navigate("/reports")}
          style={{ marginTop: 8, padding: "12px 28px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          ← Back to Reports
        </button>
      </div>
    );
  }

  const {
    name                  = "N/A",
    trade                 = "—",
    project               = "Various",
    dailyWage             = 0,
    estimatedMonthlyPayout = 0,
    status,
    phone,
    email,
    joinDate,
    attendance,
  } = worker;

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const statCards = [
    { label: "Daily Wage",       value: `₹${Number(dailyWage).toLocaleString("en-IN")}`,                      icon: "💰" },
    { label: "Monthly Payout",   value: `₹${Number(estimatedMonthlyPayout).toLocaleString("en-IN")}`,          icon: "📆" },
    { label: "Trade / Role",     value: trade || "—",                                                           icon: "🔧" },
    { label: "Project",          value: project || "Various",                                                   icon: "🏗️" },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "#f7f7f8", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "0 28px", height: 64, flexShrink: 0, display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "1px solid #e5e5e5", cursor: "pointer", fontSize: 14, color: "#555", padding: "8px 16px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}>
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>Worker Details</h1>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px 60px", boxSizing: "border-box" }}>

        {/* Profile Hero */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: "32px 36px", display: "flex", alignItems: "center", gap: 28, marginBottom: 28, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#ea580c,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 16px rgba(234,88,12,0.35)" }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "#111" }}>{name}</h2>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#888" }}>{trade}{project && project !== "Various" ? ` · ${project}` : ""}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {phone  && <span style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>📞 {phone}</span>}
              {email  && <span style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>✉️ {email}</span>}
              {joinDate && <span style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>📅 Joined {new Date(joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
            </div>
          </div>

          {/* Status badge */}
          {status && (
            <div style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
              background: status === "Active" ? "#dcfce7" : status === "On Leave" ? "#fef9c3" : "#fee2e2",
              color:      status === "Active" ? "#166534" : status === "On Leave" ? "#854d0e" : "#991b1b",
            }}>
              {status}
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "22px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em" }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Attendance (if present) */}
        {typeof attendance === "number" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "24px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", marginBottom: 14 }}>ATTENDANCE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(attendance, 100)}%`, height: "100%", background: attendance >= 80 ? "#16a34a" : attendance >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 5, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#111", whiteSpace: "nowrap" }}>{attendance}%</span>
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
