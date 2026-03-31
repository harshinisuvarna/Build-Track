// src/screens/managesite_dashboard.jsx
// Reads project data from route state and loads real financial stats from API

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { workerAPI, transactionAPI, projectAPI } from "../api";

const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "http://localhost:5000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

function projectInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "🏗️";
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

export default function ManageSitePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Read project from route state ─────────────────────────────────────────
  const project = location.state?.project || null;

  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const [search,       setSearch]       = useState("");
  const [workers,      setWorkers]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingW,     setLoadingW]     = useState(true);
  const [loadingT,     setLoadingT]     = useState(true);

  // ── Real financial stats from aggregation API ─────────────────────────────
  const [stats,        setStats]        = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Load real financial stats ─────────────────────────────────────────────
  useEffect(() => {
    if (!project) return;
    const projectId = project._id || project.id;
    setLoadingStats(true);
    projectAPI.getStats(projectId)
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [project]);

  // ── Load workers filtered by current project ─────────────────────────────
  useEffect(() => {
    if (!project) return;
    setLoadingW(true);
    const projectId = project._id || project.id;
    workerAPI.getAll({ project: projectId })
      .then(({ data }) => {
        const all = data.workers || [];
        const filtered = all.filter(w =>
          !w.assignedProject ||
          w.assignedProject === projectId ||
          w.assignedProject === project.projectName
        );
        setWorkers(filtered);
      })
      .catch(() => setWorkers([]))
      .finally(() => setLoadingW(false));
  }, [project]);

  // ── Load recent transactions filtered by current project ──────────────────
  useEffect(() => {
    if (!project) return;
    setLoadingT(true);
    const projectId = project._id || project.id;
    transactionAPI.getAll({ project: projectId })
      .then(({ data }) => {
        const all = data.transactions || [];
        const filtered = all.filter(t =>
          !t.project ||
          t.project === projectId ||
          t.project === project.projectName
        );
        setTransactions(filtered.slice(0, 5));
      })
      .catch(() => setTransactions([]))
      .finally(() => setLoadingT(false));
  }, [project]);

  // If no project was passed, redirect back to projects list
  if (!project) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh", fontFamily: "'Segoe UI', sans-serif",
        gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🏗️</div>
        <h2 style={{ margin: 0, color: "#1a1a1a" }}>No project selected</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Please select a project from the projects list.</p>
        <button
          onClick={() => navigate("/projects")}
          style={{
            padding: "12px 24px", background: "#ea580c", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: "pointer", boxShadow: "0 4px 14px rgba(234,88,12,0.3)",
          }}
        >
          ← Go to Projects
        </button>
      </div>
    );
  }

  // ── Derived data from project + stats ─────────────────────────────────────
  const projectName  = project.projectName || "Untitled Project";
  const projectLoc   = project.location || "—";
  const progress     = project.progress || 0;
  const budget       = Number(project.budget) || 0;
  const status       = project.status || "Active";

  const hasPhoto = Boolean(project.photo && String(project.photo).trim());
  const imgSrc = hasPhoto ? `${API_ORIGIN}/uploads/${project.photo}` : "";

  // Use real stats from API, fallback to budget-only if loading
  const totalBudget = stats?.totalBudget ?? budget;
  const spent       = stats?.totalSpent ?? 0;
  const remaining   = stats?.remainingBudget ?? (budget - spent);

  // Status badge colors
  const statusMap = {
    Active:          { bg: "#dcfce7", color: "#166534" },
    Completed:       { bg: "#e0e7ff", color: "#3730a3" },
    "On Hold":       { bg: "#fef9c3", color: "#854d0e" },
    "Review Needed": { bg: "#fee2e2", color: "#991b1b" },
  };
  const st = statusMap[status] || statusMap.Active;

  // Active personnel = first 4 workers + overflow
  const activeWorkers = workers.filter(w => w.status === "Active");
  const shownWorkers  = activeWorkers.slice(0, 4);
  const overflowCount = Math.max(0, activeWorkers.length - 4);

  // Activity log from real transactions
  const activityIcons = {
    Income:    { icon: "💰", color: "#dcfce7" },
    Wages:     { icon: "👷", color: "#dbeafe" },
    Expense:   { icon: "📦", color: "#fef9c3" },
    Materials: { icon: "🧱", color: "#f3e8ff" },
  };

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "Just now";
    if (mins < 60)  return `${mins} min${mins > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7)   return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(dateStr).toLocaleDateString("en-IN");
  }

  // Simple milestone estimate from progress
  const milestones = [
    { label: "Foundation",         phase: 1, done: progress >= 20 },
    { label: "Structure",          phase: 2, done: progress >= 40 },
    { label: "MEP Works",          phase: 3, done: progress >= 60, current: progress >= 40 && progress < 60 },
    { label: "Finishing",          phase: 4, done: progress >= 80, current: progress >= 60 && progress < 80 },
    { label: "Handover",           phase: 5, done: progress >= 100, current: progress >= 80 && progress < 100 },
  ];
  const hasExplicitCurrent = milestones.some(m => m.current);
  if (!hasExplicitCurrent) {
    const firstUndone = milestones.find(m => !m.done);
    if (firstUndone) firstUndone.current = true;
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8",
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#888" }}>
          <span onClick={() => navigate("/projects")} style={{ color: "#ea580c", cursor: "pointer", fontWeight: 500 }}>Projects</span>
          <span>›</span>
          <span style={{ color: "#1a1a1a", fontWeight: 600 }}>{projectName}</span>
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

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hero Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {hasPhoto ? (
              <img
                src={imgSrc}
                alt={projectName}
                style={{ width: isMobile ? "100%" : 300, height: isMobile ? 200 : "100%", objectFit: "cover", display: "block", minHeight: 200 }}
              />
            ) : (
              <div
                style={{
                  width: isMobile ? "100%" : 300,
                  height: isMobile ? 200 : "100%",
                  minHeight: 200,
                  background: "#2a2a2a",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {projectInitials(projectName)}
              </div>
            )}
            <span style={{ position: "absolute", top: 14, left: 14, padding: "5px 14px", background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, borderRadius: 6, letterSpacing: "0.04em" }}>
              {status.toUpperCase()}
            </span>
          </div>

          <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a1a" }}>{projectName}</h2>
              <button
                onClick={() => navigate("/newproject", { state: { editProject: project } })}
                style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
              >
                ✏️ Edit Details
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📍</span> {projectLoc}
              {project.manager && <> · Manager: <strong>{project.manager}</strong></>}
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Project Completion</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#ea580c" }}>{progress}%</span>
              </div>
              <div style={{ height: 8, background: "#f0f0f0", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#ea580c", borderRadius: 6, transition: "width 0.4s ease" }} />
              </div>
            </div>

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

        {/* Financial + Personnel Row */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16 }}>

          {/* Financial Breakdown — from real transaction aggregation */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Financial Breakdown</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>All figures in ₹</span>
            </div>

            {loadingStats ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ background: "#fafafa", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0f0", height: 80 }}>
                    <div style={{ width: "60%", height: 10, background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ width: "80%", height: 16, background: "#f0f0f0", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div style={{ background: "#fafafa", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6 }}>TOTAL BUDGET</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
                    {totalBudget ? `₹${totalBudget.toLocaleString("en-IN")}` : "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                    {project.startDate ? `Allocated ${new Date(project.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}
                  </div>
                </div>
                <div style={{ background: "#fff7f0", borderRadius: 10, padding: "12px 14px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#ea580c", letterSpacing: "0.06em", marginBottom: 6 }}>ACTUAL SPENT</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#ea580c" }}>
                    {`₹${spent.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                    {totalBudget > 0 ? `${((spent / totalBudget) * 100).toFixed(1)}% of total budget` : ""}
                  </div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: "0.06em", marginBottom: 6 }}>REMAINING</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d" }}>
                    {`₹${remaining.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ fontSize: 11, color: remaining > 0 ? "#16a34a" : "#dc2626", marginTop: 4, fontWeight: 600 }}>
                    {remaining > 0 ? "Within Projections" : remaining === 0 ? "Fully Spent" : "Over Budget"}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Budget utilization</span>
              <span onClick={() => navigate("/reports")} style={{ fontSize: 12, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>View Full Report</span>
            </div>
          </div>

          {/* Active Personnel — from real worker data */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Active Personnel</span>
              <span style={{ padding: "4px 12px", background: "#fff5f0", color: "#ea580c", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #fde4d0" }}>
                {loadingW ? "…" : `${activeWorkers.length} Active`}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              {loadingW ? (
                <div style={{ color: "#aaa", fontSize: 13, padding: 16, textAlign: "center" }}>Loading workers…</div>
              ) : shownWorkers.length === 0 ? (
                <div style={{ color: "#aaa", fontSize: 13, padding: 16, textAlign: "center" }}>No active workers yet.</div>
              ) : (
                <>
                  {shownWorkers.map((w) => (
                    <div key={w._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#ea580c", flexShrink: 0 }}>
                        {w.name ? w.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{w.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{w.trade || "General Labor"}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: w.status === "Active" ? "#16a34a" : "#d1d5db", flexShrink: 0 }} />
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#888", flexShrink: 0 }}>+{overflowCount}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Other workers</div>
                        <div style={{ fontSize: 12, color: "#888" }}>General labor & sub-contractors</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
              <button onClick={() => navigate("/workers")} style={{ width: "100%", padding: "12px 0", background: "#f5f5f5", color: "#444", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Manage All Personnel
              </button>
            </div>
          </div>
        </div>

        {/* Recent Site Activity — from real transactions */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Recent Site Activity</span>
            <span onClick={() => navigate("/transaction")} style={{ fontSize: 13, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>View History</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loadingT ? (
              <div style={{ color: "#aaa", fontSize: 13, padding: 16, textAlign: "center" }}>Loading activity…</div>
            ) : transactions.length === 0 ? (
              <div style={{ color: "#aaa", fontSize: 13, padding: 16, textAlign: "center" }}>No recent transactions.</div>
            ) : (
              transactions.map((t, i) => {
                const info = activityIcons[t.type] || { icon: "📋", color: "#f3e8ff" };
                return (
                  <div key={t._id || i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px", borderRadius: 10, background: "#fafafa", border: "1px solid #f0f0f0" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: info.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{info.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{t.title || t.type}</div>
                      <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                        {t.type === "Income" ? "+" : "−"}₹{t.amount?.toLocaleString("en-IN")}
                        {t.worker ? ` · ${t.worker}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(t.date)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}