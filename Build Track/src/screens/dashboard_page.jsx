// src/pages/dashboard_page.jsx
import { useNavigate, useOutletContext } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TOPBAR_H = 65;

const weeklyData = [
  { day: "MON", revenue: 3200, expenses: 1800 },
  { day: "TUE", revenue: 5800, expenses: 2100 },
  { day: "WED", revenue: 4900, expenses: 2400 },
  { day: "THU", revenue: 4200, expenses: 1900 },
  { day: "FRI", revenue: 2100, expenses: 1200 },
  { day: "SAT", revenue: 7800, expenses: 3100 },
  { day: "SUN", revenue: 5200, expenses: 2200 },
];

const stats = [
  { label: "Total Income",   value: "₹45,200", change: "+12.5%", up: true,  icon: "📈", bg: "#f0fdf4" },
  { label: "Expenses",       value: "₹12,800", change: "+5.2%",  up: false, icon: "📉", bg: "#fff5f5" },
  { label: "Net Profit",     value: "₹32,400", change: "+18.1%", up: true,  icon: "💳", bg: "#fff7ed" },
  { label: "Active Workers", value: "156",      change: "-2.4%",  up: false, icon: "👥", bg: "#f5f3ff" },
];

const projects = [
  { name: "Skyline Residences",      icon: "🏢", manager: "John D.",  initials: "JD", status: "In Progress", statusColor: "#d1fae5", statusText: "#065f46", budget: "₹2,40,000", progress: 75,  barColor: "#ea580c" },
  { name: "Steel Foundry Expansion", icon: "🏗️", manager: "Sarah L.", initials: "SL", status: "On Hold",     statusColor: "#fef9c3", statusText: "#854d0e", budget: "₹89,000",   progress: 32,  barColor: "#eab308" },
  { name: "Sunset Villas",           icon: "🏠", manager: "Mike R.",  initials: "MR", status: "Completed",   statusColor: "#dcfce7", statusText: "#166534", budget: "₹4,12,000", progress: 100, barColor: "#16a34a" },
  { name: "Metro Bridge Hub",        icon: "🏛️", manager: "Emma W.",  initials: "EW", status: "In Progress", statusColor: "#d1fae5", statusText: "#065f46", budget: "₹1.2M",     progress: 12,  barColor: "#ea580c" },
];

const recentActivity = [
  { icon: "💰", text: "Payment of ₹18,000 released to Raj Patel",  time: "2m ago" },
  { icon: "📋", text: 'New project "Harbor Phase 2" created',       time: "1h ago" },
  { icon: "👷", text: "3 workers checked in at Skyline Residences", time: "3h ago" },
  { icon: "⚠️", text: "Budget overrun alert on Steel Foundry",      time: "5h ago" },
  { icon: "✅", text: "Sunset Villas marked as Completed",          time: "1d ago" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = false;
  const width = window.innerWidth;

  const isNarrow  = width < 640;
  const isDesktop = width >= 1100;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden",
      flex: 1, minWidth: 0, width: "100%",
    }}>

      {/* ── Topbar ── */}
      <div style={{
        height: TOPBAR_H, flexShrink: 0,
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 0, flexShrink: 0, color: "#555" }}>
              ☰
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: "clamp(16px,2vw,20px)", fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>
            Dashboard Overview
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: "#f5f5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}>🔔</div>
          <div style={{ width: 36, height: 36, background: "#f5f5f5", border: "2px solid #e5e5e5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>?</div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{
        height: `calc(100vh - ${TOPBAR_H}px)`,
        overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch",
        padding: "clamp(16px,2.5vw,28px) clamp(16px,3vw,28px) 60px",
        display: "flex", flexDirection: "column", gap: "clamp(14px,2vw,22px)", boxSizing: "border-box",
      }}>

        {/* Page heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
              Dashboard Overview
            </h2>
            <p style={{ margin: 0, fontSize: "clamp(12px,1.2vw,14px)", color: "#888" }}>
              Welcome back, Alex. Here's what's happening today.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/newworker")}
              style={{ padding: "10px 18px", background: "#fff", color: "#555", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              👥 Workers
            </button>
            <button
              onClick={() => navigate("/newproject")}
              style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 14px rgba(234,88,12,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#c2410c"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#ea580c"; e.currentTarget.style.transform = "translateY(0)"; }}>
              + New Project
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4,1fr)", gap: "clamp(10px,1.5vw,16px)" }}>
          {stats.map(card => (
            <div
              key={card.label}
              style={{ background: "#fff", borderRadius: "clamp(12px,1.5vw,16px)", padding: "clamp(14px,2vw,20px)", border: "1px solid #ebebeb", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 10, transition: "transform 0.2s,box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "clamp(11px,1.1vw,13px)", color: "#777", fontWeight: 600 }}>{card.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{card.icon}</div>
              </div>
              <div style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>{card.value}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "clamp(10px,1vw,12px)", fontWeight: 700, color: card.up ? "#16a34a" : "#dc2626", background: card.up ? "#f0fdf4" : "#fff5f5", padding: "2px 8px", borderRadius: 20 }}>
                  {card.up ? "▲" : "▼"} {card.change}
                </span>
                <span style={{ fontSize: "clamp(10px,1vw,12px)", color: "#aaa" }}>vs last period</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: "#fff", borderRadius: "clamp(12px,1.5vw,16px)", padding: "clamp(16px,2vw,24px)", border: "1px solid #ebebeb", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: "clamp(14px,1.4vw,16px)", fontWeight: 700, color: "#1a1a1a" }}>Weekly Performance</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>Revenue vs Expenses — Last 7 Days</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "clamp(18px,2vw,22px)", fontWeight: 800, color: "#ea580c" }}>₹84,000</div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>▲ +10.5% growth</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            {[["Revenue", "#ea580c"], ["Expenses", "#6366f1"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ea580c" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#bbb", fontSize: 11 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 12 }}
                formatter={(v, name) => [`₹${v.toLocaleString("en-IN")}`, name === "revenue" ? "Revenue" : "Expenses"]}
              />
              <Area type="monotone" dataKey="revenue"  stroke="#ea580c" strokeWidth={2.5} fill="url(#gRev)" dot={false} />
              <Area type="monotone" dataKey="expenses" stroke="#6366f1" strokeWidth={2}   fill="url(#gExp)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Project Activity */}
        <div style={{ background: "#fff", borderRadius: "clamp(12px,1.5vw,16px)", border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>

          {/* Card header */}
          <div style={{ padding: "clamp(14px,2vw,20px)", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "clamp(14px,1.4vw,16px)", color: "#1a1a1a" }}>Recent Project Activity</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{projects.length} active projects this month</div>
            </div>
            <span
              onClick={() => navigate("/projects")}
              style={{ fontSize: 13, color: "#ea580c", fontWeight: 700, cursor: "pointer", padding: "6px 14px", background: "#fff5f0", borderRadius: 8, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fde8d8"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff5f0"}>
              View all →
            </span>
          </div>

          {/* FIX 2: Activity feed — no border on last item, proper padding, bigger text */}
          <div style={{ padding: "4px clamp(14px,2vw,20px) 8px" }}>
            {recentActivity.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 0",
                  borderBottom: i < recentActivity.length - 1 ? "1px solid #f5f5f5" : "none",
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#f7f7f8", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#333", lineHeight: 1.55, fontWeight: 500 }}>
                    {a.text}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Projects table */}
          {!isNarrow ? (
            <div style={{ padding: "0 clamp(14px,2vw,20px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.4fr 80px", padding: "10px 4px", borderBottom: "1px solid #f0f0f0" }}>
                {["PROJECT NAME", "MANAGER", "STATUS", "BUDGET", "PROGRESS", ""].map(col => (
                  <div key={col} style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.08em" }}>{col}</div>
                ))}
              </div>
              {projects.map((p, idx) => (
                <div
                  key={p.name}
                  onClick={() => navigate("/projects")}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.4fr 80px", padding: "14px 4px", borderBottom: idx < projects.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", borderRadius: 8, transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: "#fff5f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{p.icon}</div>
                    <span style={{ fontWeight: 600, fontSize: "clamp(12px,1.2vw,14px)", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4338ca", flexShrink: 0 }}>{p.initials}</div>
                    <span style={{ fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{p.manager}</span>
                  </div>
                  <div>
                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.statusColor, color: p.statusText, whiteSpace: "nowrap" }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{p.budget}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${p.progress}%`, height: "100%", background: p.barColor, borderRadius: 4, transition: "width 1s ease" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#555", minWidth: 30 }}>{p.progress}%</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button style={{ background: "none", border: "none", color: "#ea580c", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>VIEW →</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "clamp(12px,2vw,16px)", display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map(p => (
                <div
                  key={p.name}
                  onClick={() => navigate("/projects")}
                  style={{ border: "1px solid #ebebeb", borderRadius: 14, padding: 14, cursor: "pointer", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, background: "#fff5f0", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{p.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{p.manager}</div>
                    </div>
                    <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.statusColor, color: p.statusText, whiteSpace: "nowrap" }}>{p.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>Budget: <strong style={{ color: "#333" }}>{p.budget}</strong></span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.barColor }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${p.progress}%`, height: "100%", background: p.barColor, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>{/* end Recent Project Activity card */}

      </div>{/* end scroll */}
    </div>
  );
}