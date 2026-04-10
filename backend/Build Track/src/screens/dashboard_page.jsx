import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardAPI, transactionAPI } from "../api";

const TOPBAR_H = 65;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashData,  setDashData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [isNarrow,  setIsNarrow]  = useState(window.innerWidth < 640);

  // ✅ NEW: local transactions so we can compute Materials spend client-side
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // ✅ Fetch dashboard summary AND all transactions in parallel
    Promise.all([
      dashboardAPI.getSummary(),
      transactionAPI.getAll(),
    ])
      .then(([dashRes, txRes]) => {
        if (!isMounted) return;
        setDashData(dashRes.data);
        setTransactions(txRes.data.transactions || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888" }}>
        Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, color: "#dc2626", textAlign: "center" }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", borderRadius: 8, background: "#ea580c", color: "#fff", border: "none", cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  const { weeklyChart, recentProjects, recentActivity } = dashData;
  const s = dashData.stats;

  // ✅ Recalculate totals client-side so Materials is always counted as expense
  const totalIncome = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === "Expense" || t.type === "Materials" || t.type === "Wages")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const materialsSpend = transactions
    .filter(t => t.type === "Materials")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netProfit = totalIncome - totalExpenses;

  // ✅ Use client-computed values; fall back to backend stats if no transactions yet
  const income   = transactions.length ? totalIncome   : (s.totalIncome   || 0);
  const expenses = transactions.length ? totalExpenses : (s.totalExpenses || 0);
  const profit   = transactions.length ? netProfit     : (s.netProfit     || 0);

  const statCards = [
    { label: "Total Income",    value: `₹${income.toLocaleString("en-IN")}`,            change: "Real-time",        up: true,  icon: "📈", bg: "#f0fdf4" },
    { label: "Expenses",        value: `₹${expenses.toLocaleString("en-IN")}`,           change: "Real-time",        up: false, icon: "📉", bg: "#fff5f5" },
    { label: "Net Profit",      value: `₹${Math.abs(profit).toLocaleString("en-IN")}`,   change: profit >= 0 ? "Profit" : "Loss", up: profit >= 0, icon: "💳", bg: "#fff7ed" },
    { label: "Active Workers",  value: (s.activeWorkers || 0).toString(),                change: "Currently Active", up: true,  icon: "👥", bg: "#f5f3ff" },
  ];

  // ✅ Extra row: Materials spend card (only shown if any materials exist)
  const showMaterials = materialsSpend > 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100vh",
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
        flex: 1,
        minHeight: 0,
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
              Welcome back, {(() => { try { return JSON.parse(localStorage.getItem("bt_user"))?.name?.split(" ")[0] || "there"; } catch { return "there"; } })()}. Here's what's happening today.
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
          {statCards.map(card => (
            <div
              key={card.label}
              style={{ background: "#fff", borderRadius: "clamp(12px,1.5vw,16px)", padding: "clamp(14px,2vw,20px)", border: "1px solid #ebebeb", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 10, transition: "transform 0.2s,box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "clamp(11px,1.1vw,13px)", color: "#777", fontWeight: 600 }}>{card.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{card.icon}</div>
              </div>
              <div style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 800, color: card.label === "Net Profit" && profit < 0 ? "#dc2626" : "#1a1a1a", letterSpacing: "-0.5px" }}>
                {card.label === "Net Profit" && profit < 0 ? "−" : ""}{card.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "clamp(10px,1vw,12px)", fontWeight: 700, color: card.up ? "#16a34a" : "#dc2626", background: card.up ? "#f0fdf4" : "#fff5f5", padding: "2px 8px", borderRadius: 20 }}>
                  {card.up ? "▲" : "▼"} {card.change}
                </span>
                <span style={{ fontSize: "clamp(10px,1vw,12px)", color: "#aaa" }}>info</span>
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
              <div style={{ fontSize: "clamp(18px,2vw,22px)", fontWeight: 800, color: "#ea580c" }}>₹{income.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Current Period Data</div>
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
            <AreaChart data={weeklyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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

        {/* Recent Transaction Activity */}
        <div style={{ background: "#fff", borderRadius: "clamp(12px,1.5vw,16px)", border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "clamp(14px,2vw,20px)", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "clamp(14px,1.4vw,16px)", color: "#1a1a1a" }}>Recent Transaction Activity</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{recentActivity.length} recent transactions</div>
            </div>
            <span
              onClick={() => navigate("/transaction")}
              style={{ fontSize: 13, color: "#ea580c", fontWeight: 700, cursor: "pointer", padding: "6px 14px", background: "#fff5f0", borderRadius: 8, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fde8d8"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff5f0"}>
              View all →
            </span>
          </div>

          <div style={{ padding: "4px clamp(14px,2vw,20px) 8px" }}>
            {recentActivity.map((a, i) => (
              <div
                key={i}
                onClick={() => navigate("/transaction")}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 0",
                  borderBottom: i < recentActivity.length - 1 ? "1px solid #f5f5f5" : "none",
                  cursor: "pointer",
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#f7f7f8", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  {a.type === "Income" ? "💰" : a.type === "Materials" ? "🧱" : a.type === "Wages" ? "👷" : "📉"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#333", lineHeight: 1.55, fontWeight: 500 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{new Date(a.date).toLocaleDateString()}</div>
                </div>
                {/* ✅ Show amount in activity feed */}
                <div style={{ fontSize: 13, fontWeight: 700, color: a.type === "Income" ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                  {a.type === "Income" ? "+" : "−"}₹{(a.amount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}