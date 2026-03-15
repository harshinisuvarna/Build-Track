import { useState, useEffect } from "react";

const personnel = [
  { name: "Ramesh Kumar",  role: "Master Electrician", initials: "RK" },
  { name: "Suresh Singh",  role: "Foreman",            initials: "SS" },
  { name: "Deepak Verma",  role: "Masonry Lead",       initials: "DV" },
  { name: "Anjali Sharma", role: "Safety Inspector",   initials: "AS" },
];

const activityLog = [
  { icon: "📦", title: "Material Delivery",       desc: "120 bags of cement delivered to site",     time: "2 hours ago",  color: "#dbeafe", tcolor: "#1e40af" },
  { icon: "👷", title: "Worker Check-in",          desc: "42 workers checked in for morning shift",  time: "4 hours ago",  color: "#dcfce7", tcolor: "#166534" },
  { icon: "⚠️", title: "Safety Inspection",        desc: "Phase 3 safety audit completed — passed",  time: "Yesterday",    color: "#fef9c3", tcolor: "#854d0e" },
  { icon: "💰", title: "Payment Processed",        desc: "Labour payroll ₹3.2L disbursed",           time: "2 days ago",   color: "#dcfce7", tcolor: "#166534" },
  { icon: "📋", title: "Milestone Update",         desc: "Structural Framing Phase 3 at 65%",        time: "3 days ago",   color: "#f3e8ff", tcolor: "#6b21a8" },
];

const milestones = [
  { label: "Foundation",          done: true,    phase: 1 },
  { label: "Basement & Podium",   done: true,    phase: 2 },
  { label: "Structural Framing",  done: false,   phase: 3, current: true },
  { label: "MEP Works",           done: false,   phase: 4 },
  { label: "Finishing & Handover",done: false,   phase: 5 },
];


export default function ManageSitePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8", overflow: "hidden" }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#888" }}>
              <span style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}>Projects</span>
              <span>›</span>
              <span style={{ color: "#1a1a1a", fontWeight: 600 }}>Skyline Tower</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 10, padding: "8px 14px", gap: 8 }}>
              <span style={{ color: "#aaa", fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search site data..."
                style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 100 : 160 }} />
            </div>
            <div style={{ width: 36, height: 36, background: "#f5f5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}>🔔</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Hero Card ── */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: isMobile ? "column" : "row" }}>

            {/* Site Image */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=320&fit=crop"
                alt="Skyline Tower"
                style={{ width: isMobile ? "100%" : 300, height: isMobile ? 200 : "100%", objectFit: "cover", display: "block", minHeight: 200 }}
              />
              <span style={{ position: "absolute", top: 14, left: 14, padding: "5px 14px", background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, borderRadius: 6, letterSpacing: "0.04em" }}>ON TRACK</span>
            </div>

            {/* Project Info */}
            <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a1a" }}>Skyline Tower</h2>
                <button style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  ✏️ Edit Details
                </button>
              </div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                <span>📍</span> Mumbai, Sector 42 · Commercial Complex
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Project Completion</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#ea580c" }}>65%</span>
                </div>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ width: "65%", height: "100%", background: "#ea580c", borderRadius: 6 }} />
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>Current Phase: Structural Framing (Phase 3 of 5)</div>
              </div>

              {/* Phase Milestones */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {milestones.map((m) => (
                  <div key={m.phase} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.done ? "#ea580c" : m.current ? "#fff5f0" : "#f0f0f0", border: m.current ? "2px solid #ea580c" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: m.done ? "#fff" : m.current ? "#ea580c" : "#aaa", flexShrink: 0 }}>
                      {m.done ? "✓" : m.phase}
                    </div>
                    {!isMobile && <span style={{ fontSize: 12, color: m.done ? "#1a1a1a" : m.current ? "#ea580c" : "#aaa", fontWeight: m.current ? 600 : 400 }}>{m.label}</span>}
                    {m.phase < milestones.length && <span style={{ color: "#e5e5e5", fontSize: 16 }}>—</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Financial + Personnel Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16 }}>

            {/* Financial Breakdown */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Financial Breakdown</span>
                <span style={{ fontSize: 12, color: "#aaa" }}>All figures in ₹</span>
              </div>

              {/* 3 Budget Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div style={{ background: "#fafafa", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6 }}>TOTAL BUDGET</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>₹12,45,00,000</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Allocated May 2023</div>
                </div>
                <div style={{ background: "#fff7f0", borderRadius: 10, padding: "12px 14px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#ea580c", letterSpacing: "0.06em", marginBottom: 6 }}>TOTAL SPENT</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#ea580c" }}>₹8,12,35,000</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>65.2% of total budget</div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: "0.06em", marginBottom: 6 }}>REMAINING</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d" }}>₹4,32,65,000</div>
                  <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4, fontWeight: 600 }}>Within Projections</div>
                </div>
              </div>

              {/* Expense Categories */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Expense categories</span>
                <span style={{ fontSize: 12, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>View Detail Report</span>
              </div>
              {[
                { label: "Materials",       amount: "₹4.2Cr spent", pct: 78, color: "#f97316" },
                { label: "Labor & Payroll", amount: "₹2.8Cr spent", pct: 52, color: "#3b82f6" },
                { label: "Permits & Admin", amount: "₹1.1Cr spent", pct: 28, color: "#22c55e" },
              ].map((e) => (
                <div key={e.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#555" }}>{e.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>{e.amount}</span>
                  </div>
                  <div style={{ height: 5, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${e.pct}%`, height: "100%", background: e.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Active Personnel */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Active Personnel</span>
                <span style={{ padding: "4px 12px", background: "#fff5f0", color: "#ea580c", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #fde4d0" }}>42 On-Site</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                {personnel.map((p) => (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#ea580c", flexShrink: 0 }}>
                      {p.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{p.role}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
                  </div>
                ))}

                {/* +38 others */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#888", flexShrink: 0 }}>+38</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Other workers</div>
                    <div style={{ fontSize: 12, color: "#888" }}>General labor & sub-contractors</div>
                  </div>
                </div>
              </div>

              <button style={{ marginTop: 18, width: "100%", padding: "12px 0", background: "#f5f5f5", color: "#444", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Manage All Personnel
              </button>
            </div>
          </div>

          {/* ── Recent Site Activity ── */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Recent Site Activity</span>
              <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>View History</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activityLog.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px", borderRadius: 10, background: "#fafafa", border: "1px solid #f0f0f0" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap", flexShrink: 0 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}