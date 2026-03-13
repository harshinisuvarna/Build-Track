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

const workers = [
  { name: "Marcus Chen",   role: "Lead Carpenter", project: "HARBOR HEIGHTS",  projectColor: "#e0e7ff", projectText: "#3730a3", hours: "168h", rate: "₹45.00", payout: "₹7,560.00",  profit: "high" },
  { name: "Sarah Jenkins", role: "Electrician",    project: "SKYLINE TOWER",   projectColor: "#dcfce7", projectText: "#166534", hours: "160h", rate: "₹52.00", payout: "₹8,320.00",  profit: "high" },
  { name: "Oscar Valdez",  role: "General Labor",  project: "OAK RESIDENCE",   projectColor: "#fef9c3", projectText: "#854d0e", hours: "182h", rate: "₹28.00", payout: "₹5,096.00",  profit: "med"  },
  { name: "Emily Wong",    role: "Site Engineer",  project: "GREEN VALLEY",    projectColor: "#dcfce7", projectText: "#166534", hours: "175h", rate: "₹60.00", payout: "₹10,500.00", profit: "high" },
  { name: "Raj Patel",     role: "Mason",          project: "HARBOR HEIGHTS",  projectColor: "#e0e7ff", projectText: "#3730a3", hours: "190h", rate: "₹35.00", payout: "₹6,650.00",  profit: "low"  },
  { name: "Priya Nair",    role: "Supervisor",     project: "SKYLINE TOWER",   projectColor: "#dcfce7", projectText: "#166534", hours: "155h", rate: "₹70.00", payout: "₹10,850.00", profit: "high" },
];

const profitDot = { high: "#16a34a", med: "#eab308", low: "#dc2626" };

const periodTabs = ["Last Month", "October 2023", "Custom"];

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

export default function FinancialReportsPage() {
  const [activeNav,   setActiveNav]   = useState("Financial Reports");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [activePeriod,setActivePeriod]= useState("October 2023");
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.project.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

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
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Financial Reports</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 10, padding: "8px 14px", gap: 8 }}>
              <span style={{ color: "#aaa", fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
                style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 100 : 160 }} />
            </div>
            <button style={{ padding: "9px 18px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              ⬇ Export Report
            </button>
            <div style={{ width: 36, height: 36, background: "#f5f5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}>🔔</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Page Header + Action Buttons ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "#1a1a1a" }}>October 2023 Analysis</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#888", maxWidth: 420 }}>Reporting period performance and labor expenditure overview.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ padding: "10px 18px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#444", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                📋 Copy Report
              </button>
              <button style={{ padding: "10px 18px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#444", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                📊 Export CSV
              </button>
              <button style={{ padding: "10px 18px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(234,88,12,0.3)" }}>
                📄 Download PDF
              </button>
            </div>
          </div>

          {/* ── Period Tabs + Date Range ── */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #ebebeb", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 8, padding: 3, gap: 2 }}>
              {periodTabs.map((t) => (
                <button key={t} onClick={() => setActivePeriod(t)}
                  style={{
                    padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: activePeriod === t ? 600 : 400,
                    background: activePeriod === t ? "#fff" : "transparent",
                    color:      activePeriod === t ? "#ea580c" : "#666",
                    boxShadow:  activePeriod === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}>{t} {t === "October 2023" && "▾"}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#555", fontWeight: 500 }}>
              <span>📅</span> Oct 01 – Oct 31, 2023 <span style={{ color: "#aaa" }}>▾</span>
            </div>
          </div>

          {/* ── Stats + Compliance Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 16 }}>

            {/* 3 Stat Cards */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "24px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>TOTAL INCOME</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>₹4,28,500.00</div>
                <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>↑ +12.4% vs last period</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>EXPENDITURES</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>₹1,95,240.00</div>
                <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>↑ +4.2% increased costs</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>NET PROFIT</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#ea580c", marginBottom: 6 }}>₹2,33,260.00</div>
                <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>54.4% Margin</div>
              </div>
            </div>

            {/* Compliance Card */}
            <div style={{ background: "#ea580c", borderRadius: 16, padding: "24px 28px", minWidth: 220, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(234,88,12,0.35)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", marginBottom: 8 }}>OVERALL COMPLIANCE</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: 4 }}>92%</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Compliance</div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ width: "92%", height: "100%", background: "#fff", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                You are ahead of the projected budget target for the Skyline Project by 3.2%.
              </div>
            </div>
          </div>

          {/* ── Wages Per Worker Table ── */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

            {/* Table Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>Wages Per Worker</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>Breakdown of labor costs for October 2023</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>≡</button>
                  <button style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⋮</button>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>PROJECT STATUS LEGEND:</span>
                  {[["ON TRACK","#16a34a"],["IN PROGRESS","#6366f1"],["REVIEW NEEDED","#eab308"]].map(([l,c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>PROFIT LEGEND:</span>
                  {[["HIGH","#16a34a"],["MED","#eab308"],["LOW","#dc2626"]].map(([l,c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            {!isMobile ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {["WORKER DETAILS","PROJECT","TOTAL HOURS","RATE","TOTAL PAYOUT","ACTION"].map((col, i) => (
                      <th key={col} style={{ padding: "12px 20px", textAlign: i >= 2 && i <= 4 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.name} style={{ borderBottom: "1px solid #f9f9f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {initials(w.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{w.name}</div>
                            <div style={{ fontSize: 12, color: "#aaa" }}>{w.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: w.projectColor, color: w.projectText, letterSpacing: "0.04em" }}>{w.project}</span>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{w.hours}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontSize: 14, color: "#555" }}>{w.rate}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: profitDot[w.profit] }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{w.payout}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <button style={{ background: "none", border: "none", color: "#ea580c", fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.04em" }}>DETAILS</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((w) => (
                  <div key={w.name} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{initials(w.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{w.role}</div>
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: w.projectColor, color: w.projectText }}>{w.project}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: "#888" }}>{w.hours} · {w.rate}/hr</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: profitDot[w.profit] }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{w.payout}</span>
                      </div>
                      <button style={{ background: "none", border: "none", color: "#ea580c", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>DETAILS</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}