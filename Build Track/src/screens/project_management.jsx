// src/screens/project_management.jsx
// Fetches real projects from GET /api/projects
// Delete calls DELETE /api/projects/:id
// Edit navigates to /newproject with state

import { useState, useEffect, useCallback } from "react";
import { useNavigate }         from "react-router-dom";
import { projectAPI }          from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";

const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "").replace(/\/api$/, "");

const STATUS_STYLE = {
  Active:         { bg: "#dcfce7", color: "#166534", label: "ACTIVE" },
  Completed:      { bg: "#e0e7ff", color: "#3730a3", label: "COMPLETED" },
  "On Hold":      { bg: "#fef9c3", color: "#854d0e", label: "ON HOLD" },
  "Review Needed":{ bg: "#fee2e2", color: "#991b1b", label: "REVIEW NEEDED" },
};

const TABS = ["All Projects", "Active", "On Hold", "Review Needed", "Completed"];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&h=120&fit=crop";

export default function ProjectsPage() {
  const navigate = useNavigate();

  const [allProjects, setAllProjects] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [activeTab,   setActiveTab]   = useState("All Projects");
  const [search,      setSearch]      = useState("");
  const [toast,       setToast]       = useState({ msg: "", type: "info" });
  const [confirmDlg,  setConfirmDlg]  = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Fetch from backend ────────────────────────────────────────────────────
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await projectAPI.getAll();
      setAllProjects(data.projects || []);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      setError(status ? `Failed to load projects (${status}): ${msg}` : `Failed to load projects: ${msg}`);
      console.error("Failed to load projects:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        baseURL: err?.config?.baseURL,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
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

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (project) => {
    navigate("/newproject", { state: { editProject: project } });
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = allProjects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.projectName.toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q) ||
      (p.manager  || "").toLowerCase().includes(q);
    if (activeTab === "All Projects")   return matchSearch;
    if (activeTab === "Active")         return matchSearch && p.status === "Active";
    if (activeTab === "On Hold")        return matchSearch && p.status === "On Hold";
    if (activeTab === "Review Needed")  return matchSearch && p.status === "Review Needed";
    if (activeTab === "Completed")      return matchSearch && p.status === "Completed";
    return matchSearch;
  });

  // Tab counts
  const counts = {
    "All Projects":   allProjects.length,
    "Active":         allProjects.filter(p => p.status === "Active").length,
    "On Hold":        allProjects.filter(p => p.status === "On Hold").length,
    "Review Needed":  allProjects.filter(p => p.status === "Review Needed").length,
    "Completed":      allProjects.filter(p => p.status === "Completed").length,
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8",
    }}>
      {/* Toast + Confirm Dialog */}
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && (
        <ConfirmDialog
          message={confirmDlg.message}
          danger={confirmDlg.danger}
          confirmLabel={confirmDlg.confirmLabel}
          onConfirm={confirmDlg.onConfirm}
          onCancel={() => setConfirmDlg(null)}
        />
      )}

      {/* ── Top Bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Active Projects</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
            {loading ? "Loading…" : `${allProjects.length} project${allProjects.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 14px", gap: 8 }}>
            <span style={{ color: "#aaa" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 100 : 180 }}
            />
          </div>
          <button
            onClick={() => navigate("/newproject")}
            style={{
              padding: "10px 20px", background: "#ea580c", color: "#fff",
              border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}
          >
            + New Project
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "0 24px", display: "flex", gap: 4, flexShrink: 0,
      }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: "14px 4px", marginRight: 20,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: activeTab === t ? 600 : 400,
              color: activeTab === t ? "#ea580c" : "#777",
              borderBottom: activeTab === t ? "2.5px solid #ea580c" : "2.5px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "20px 24px" }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "#aaa", fontSize: 14 }}>
            Loading projects…
          </div>
        )}

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
            {filtered.map((p) => {
              const st = STATUS_STYLE[p.status] || STATUS_STYLE["Active"];
              const imgSrc = p.photo
                ? `${API_ORIGIN}/uploads/${p.photo}`
                : FALLBACK_IMG;

              return (
                <div key={p._id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

                  {/* Card Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                    <img src={imgSrc} alt={p.projectName}
                      style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                      onError={e => { e.target.src = FALLBACK_IMG; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{p.projectName}</span>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                      </div>
                      {p.manager && (
                        <div style={{ fontSize: 13, color: "#777" }}>Manager: <span style={{ color: "#444", fontWeight: 500 }}>{p.manager}</span></div>
                      )}
                      {p.location && (
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>📍 {p.location}</div>
                      )}
                    </div>
                    {/* Edit icon */}
                    <span
                      onClick={() => handleEdit(p)}
                      style={{ color: "#ccc", fontSize: 18, cursor: "pointer", flexShrink: 0 }}
                      title="Edit project"
                    >✏️</span>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Project Progress</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>{p.progress || 0}%</span>
                    </div>
                    <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${p.progress || 0}%`, height: "100%", background: "#ea580c", borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                  </div>

                  {/* Budget */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18, background: "#fafafa", borderRadius: 10, padding: "12px 14px" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 4 }}>TOTAL BUDGET</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                        {p.budget ? `₹${Number(p.budget).toLocaleString("en-IN")}` : "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 4 }}>START DATE</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                        {p.startDate ? new Date(p.startDate).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => navigate("/managesite", { state: { project: p } })}
                      style={{
                        flex: 1, padding: "12px 0", background: "#1a1a1a", color: "#fff",
                        border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14,
                        cursor: "pointer", transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#333"}
                      onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}
                    >
                      Manage Site
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.projectName)}
                      style={{
                        width: 44, height: 44, background: "#fff5f5", border: "1px solid #fee2e2",
                        borderRadius: 10, cursor: "pointer", fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>

                </div>
              );
            })}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: 48, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                {allProjects.length === 0
                  ? 'No projects yet. Click "+ New Project" to get started.'
                  : "No projects match your search."}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}