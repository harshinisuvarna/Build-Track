import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { projectAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";
import { resolveImageUrl } from "../utils/imageUrl";
import { colors, radius, spacing, shadows, gradients, typography } from "../styles/designTokens";

const STATUS_STYLE = {
  planning:   { bg: "#FFF8E1", border: "#FFC107", text: "#F57F17", label: "Planning" },
  inprogress: { bg: "#E8F0FE", border: "#4A6CF7", text: "#3D5AFE", label: "In Progress" },
  onhold:     { bg: "#FFF3E0", border: "#FF9800", text: "#E65100", label: "On Hold" },
  completed:  { bg: "#E8F5E9", border: "#43A047", text: "#2E7D32", label: "Completed" },
  cancelled:  { bg: "#FFEBEE", border: "#E53935", text: "#C62828", label: "Cancelled" },
};

const TABS = ["All Projects", "Active", "On Hold", "Review Needed", "Completed"];

function statusKey(raw) {
  if (!raw) return "inprogress";
  const s = raw.toLowerCase().replace(/\s+/g, "");
  if (s === "planning") return "planning";
  if (s === "inprogress" || s === "active") return "inprogress";
  if (s === "onhold") return "onhold";
  if (s === "completed") return "completed";
  if (s === "cancelled" || s === "reviewneeded") return "cancelled";
  return "inprogress";
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("All Projects");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [confirmDlg, setConfirmDlg] = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await projectAPI.getAll();
      setAllProjects(data.projects || []);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      setError(status ? `Failed to load projects (${status}): ${msg}` : `Failed to load projects: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = (projectId, projectName) => {
    setConfirmDlg({
      message: `Delete "${projectName}"? This action cannot be undone.`,
      danger: true,
      confirmLabel: "Delete Project",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await projectAPI.delete(projectId);
          setAllProjects(prev => prev.filter(p => p._id !== projectId));
          setToast({ msg: `"${projectName}" deleted successfully.`, type: "success" });
        } catch (err) {
          setToast({ msg: err.response?.data?.message || "Failed to delete project.", type: "error" });
        }
      },
    });
  };

  const filtered = allProjects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.projectName?.toLowerCase().includes(q) || (p.location || "").toLowerCase().includes(q) || (p.manager || "").toLowerCase().includes(q);
    if (activeTab === "All Projects") return matchSearch;
    const t = activeTab;
    const status = (p.status || "").toLowerCase();
    if (t === "Active") return matchSearch && (status === "active" || status === "inprogress" || status === "in progress");
    if (t === "On Hold") return matchSearch && (status === "onhold" || status === "on hold");
    if (t === "Review Needed") return matchSearch && (status === "cancelled" || status === "reviewneeded" || status === "review needed");
    if (t === "Completed") return matchSearch && status === "completed";
    return matchSearch;
  });

  const counts = {
    "All Projects": allProjects.length,
    "Active": allProjects.filter(p => { const s = (p.status || "").toLowerCase(); return s === "active" || s === "inprogress" || s === "in progress"; }).length,
    "On Hold": allProjects.filter(p => { const s = (p.status || "").toLowerCase(); return s === "onhold" || s === "on hold"; }).length,
    "Review Needed": allProjects.filter(p => { const s = (p.status || "").toLowerCase(); return s === "cancelled" || s === "reviewneeded" || s === "review needed"; }).length,
    "Completed": allProjects.filter(p => (p.status || "").toLowerCase() === "completed").length,
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", minHeight: "100vh",
      fontFamily: typography.fontFamily,
      background: colors.bgBase4,
      position: "relative",
    }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && <ConfirmDialog message={confirmDlg.message} danger={confirmDlg.danger} confirmLabel={confirmDlg.confirmLabel} onConfirm={confirmDlg.onConfirm} onCancel={() => setConfirmDlg(null)} />}

      {/* Top Bar */}
      <div style={{
        background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`,
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>Projects</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textLight }}>
            {loading ? "Loading..." : `${allProjects.length} project${allProjects.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", background: colors.bgBase4, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.sm, padding: "9px 14px", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ border: "none", outline: "none", fontSize: 13, color: colors.textPrimary, background: "transparent", width: isMobile ? 100 : 180 }} />
          </div>
          <button onClick={() => navigate("/newproject")}
            style={{
              padding: "10px 20px", border: "none", borderRadius: radius.sm,
              background: gradients.primaryButton, color: "#FFF", fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Project
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`, padding: "0 24px", display: "flex", gap: 4, flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: "14px 4px", marginRight: 20, background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: activeTab === t ? 600 : 400,
              color: activeTab === t ? colors.primaryBlue : colors.textLight,
              borderBottom: activeTab === t ? `2.5px solid ${colors.primaryBlue}` : "2.5px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: radius.sm, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
            <button onClick={fetchProjects} style={{ marginLeft: "auto", background: "transparent", border: `1px solid #FCA5A5`, borderRadius: 6, padding: "4px 12px", color: "#DC2626", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${colors.bgBase4}`, borderTopColor: colors.primaryBlue, animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: colors.textLight }}>Loading projects...</div>
          </div>
        )}

        {!loading && (
          <>
            {/* LIVE PIPELINE badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20, marginBottom: 12,
              background: `${colors.primaryBlue}15`,
              color: colors.primaryBlue, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill={colors.primaryBlue}><circle cx="12" cy="12" r="6" /></svg>
              LIVE PIPELINE
            </div>

            {/* Active Builds header */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: colors.textPrimary }}>Active Builds</h2>
              <div style={{
                padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: "#ECEBFF", color: colors.primaryBlue,
              }}>
                {allProjects.length} {allProjects.length === 1 ? "Site" : "Sites"}
              </div>
            </div>

            {/* Project list */}
            {filtered.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
                {filtered.map(p => {
                  const sk = statusKey(p.status);
                  const st = STATUS_STYLE[sk] || STATUS_STYLE.inprogress;
                  const spent = p.spentAmount || 0;
                  const budget = p.totalBudget || p.budget || 0;
                  const progress = p.progress ?? (budget > 0 ? Math.min(spent / budget, 1) : 0);
                  return (
                    <div key={p._id}
                      style={{
                        background: colors.cardBg, borderRadius: radius.xl,
                        border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
                        padding: "18px", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = shadows.card; }}
                      onClick={() => navigate("/managesite", { state: { project: p } })}>
                      {/* Name + Status */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.3px" }}>{p.projectName}</h3>
                        <div style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: st.bg, border: `1px solid ${st.border}`, color: st.text,
                          maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0,
                        }}>
                          {st.label}
                        </div>
                      </div>
                      {/* Location */}
                      {p.location && <div style={{ fontSize: 13, fontWeight: 600, color: colors.textLight, marginBottom: 12 }}>{p.location}</div>}
                      {/* Budget */}
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.primaryBlue, marginBottom: 14 }}>
                        ₹{spent.toLocaleString("en-IN")} of ₹{budget.toLocaleString("en-IN")}
                      </div>
                      {/* Progress */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: colors.textPrimary }}>Overall Progress</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: colors.primaryBlue }}>{Math.round(progress * 100)}%</span>
                      </div>
                      <div style={{ height: 7, background: "#E8ECF8", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
                        <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: colors.primaryBlue, borderRadius: 16, transition: "width 0.5s ease" }} />
                      </div>
                      {/* Divider + View Details */}
                      <div style={{ height: 1, background: "#EEF0F5", marginBottom: 10 }} />
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: colors.primaryBlue }}>View Details</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: colors.textLight, fontSize: 14 }}>
                {allProjects.length === 0
                  ? "No projects yet. Click \"New Project\" to get started."
                  : "No projects match your search."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
