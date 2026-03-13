import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const weeklyData = [
  { day: "MON", value: 3200 },
  { day: "TUE", value: 5800 },
  { day: "WED", value: 4900 },
  { day: "THU", value: 4200 },
  { day: "FRI", value: 2100 },
  { day: "SAT", value: 7800 },
  { day: "SUN", value: 5200 },
];

const projects = [
  { name: "Skyline Residences",      icon: "🏢", manager: "John D.",  status: "In Progress", statusColor: "#d1fae5", statusText: "#065f46", budget: "₹2,40,000", progress: 75,  barColor: "#ea580c" },
  { name: "Steel Foundry Expansion", icon: "🏗️", manager: "Sarah L.", status: "On Hold",     statusColor: "#fef9c3", statusText: "#854d0e", budget: "₹89,000",   progress: 32,  barColor: "#eab308" },
  { name: "Sunset Villas",           icon: "🏠", manager: "Mike R.",  status: "Completed",   statusColor: "#dcfce7", statusText: "#166534", budget: "₹4,12,000", progress: 100, barColor: "#ea580c" },
  { name: "Metro Bridge Hub",        icon: "🏛️", manager: "Emma W.",  status: "In Progress", statusColor: "#d1fae5", statusText: "#065f46", budget: "₹1.2M",     progress: 12,  barColor: "#ea580c" },
];

const navItems = [
  { label: "Dashboard", icon: "⊞" },
  { label: "Voice",     icon: "🎤" },
  { label: "Workers",   icon: "👥" },
  { label: "Log",       icon: "📋" },
  { label: "Projects",  icon: "💼" },
  { label: "Reports",   icon: "📊" },
  { label: "Settings",  icon: "⚙️" },
];

const stats = [
  { label: "Total Income",   value: "₹45,200", change: "↑ 12.5% from last month", up: true,  icon: "📈" },
  { label: "Expenses",       value: "₹12,800", change: "↑ 5.2% from last month",  up: true,  icon: "📉" },
  { label: "Net Profit",     value: "₹32,400", change: "↑ 18.1% from last month", up: true,  icon: "💳" },
  { label: "Active Workers", value: "156",      change: "↓ 2.4% from last week",   up: false, icon: "👥" },
];

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

export default function BuildTrackDashboard() {
  const [activeNav,   setActiveNav]   = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [isNarrow,    setIsNarrow]    = useState(window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsNarrow(window.innerWidth < 640);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

          {/* New Project Button */}
          <button style={{
            width: "100%", padding: "12px 0", marginTop: 16,
            background: "#ea580c", color: "#fff",
            border: "none", borderRadius: 12,
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            + New Project
          </button>
        </div>

        {/* User */}
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fdba74", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Alex Thorne</div>
              <div style={{ fontSize: 11, color: "#888" }}>Project Manager</div>
            </div>
          </div>
          <span style={{ color: "#aaa", fontSize: 16, cursor: "pointer" }}>⋮</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Header — FIXED: removed duplicate search + Alex avatar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", background: "#fff",
          borderBottom: "1px solid #ebebeb",
          flexWrap: "wrap", gap: 12, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Dashboard Overview</h1>
          </div>

          {/* ── Right side: search + bell only ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 10, padding: "8px 14px", gap: 8 }}>
              <span style={{ color: "#aaa", fontSize: 14 }}>🔍</span>
              <input placeholder="Search..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#555", width: isMobile ? 80 : 120 }} />
            </div>
            <div style={{ width: 36, height: 36, background: "#f5f5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>🔔</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {stats.map((card) => (
              <div key={card.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: "1px solid #ebebeb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#777", fontWeight: 500 }}>{card.label}</span>
                  <span style={{ fontSize: 18 }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{card.value}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: card.up ? "#16a34a" : "#dc2626" }}>{card.change}</div>
              </div>
            ))}
          </div>

          {/* Weekly Performance */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: "1px solid #ebebeb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Weekly Performance</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>Revenue vs Operating Expenses (Last 7 Days)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#ea580c" }}>₹84,000</div>
                <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>+10.5% growth</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ea580c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#aaa", fontSize: 11 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,.1)", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#ea580c" strokeWidth={2.5} fill="url(#colorVal)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Project Activity */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: "1px solid #ebebeb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Recent Project Activity</h2>
              <span style={{ fontSize: 12, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>View all</span>
            </div>

            {/* Desktop Table */}
            {!isNarrow && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr", padding: "6px 0", borderBottom: "1px solid #f0f0f0", marginBottom: 4 }}>
                  {["PROJECT NAME", "MANAGER", "STATUS", "BUDGET", "PROGRESS"].map(col => (
                    <div key={col} style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</div>
                  ))}
                </div>
                {projects.map((p) => (
                  <div key={p.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr", padding: "12px 0", borderBottom: "1px solid #f9f9f9", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, background: "#fff5f0", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{p.icon}</div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{p.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4338ca" }}>{p.manager[0]}</div>
                      <span style={{ fontSize: 12, color: "#555" }}>{p.manager}</span>
                    </div>
                    <div>
                      <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.statusColor, color: p.statusText }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#333", fontWeight: 500 }}>{p.budget}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${p.progress}%`, height: "100%", background: p.barColor, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#555", minWidth: 28 }}>{p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Cards */}
            {isNarrow && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.map((p) => (
                  <div key={p.name} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, background: "#fff5f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{p.manager}</div>
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.statusColor, color: p.statusText }}>{p.status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>Budget: <strong style={{ color: "#333" }}>{p.budget}</strong></span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#ea580c" }}>{p.progress}%</span>
                    </div>
                    <div style={{ height: 5, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${p.progress}%`, height: "100%", background: p.barColor, borderRadius: 4 }} />
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