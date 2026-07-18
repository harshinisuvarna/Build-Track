import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { projectAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";
import { resolveImageUrl } from "../utils/imageUrl";
import { Card, Badge, Button, SkeletonLine } from "../components/ui";
import { Search, Plus, Building2, ArrowRight, Edit3, Trash2 } from "lucide-react";

const STATUS_STYLE = {
  planning:   { bg: "#FFFBEB", text: "#B45309", label: "Planning" },
  inprogress: { bg: "#EEF0FF", text: "#5B5CEB", label: "Active" },
  onhold:     { bg: "#FFF7ED", text: "#C2410C", label: "On Hold" },
  completed:  { bg: "#F0FDF4", text: "#15803D", label: "Completed" },
  cancelled:  { bg: "#FEF2F2", text: "#DC2626", label: "Cancelled" },
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
    const status = (p.status || "").toLowerCase();
    if (activeTab === "Active") return matchSearch && (status === "active" || status === "inprogress" || status === "in progress");
    if (activeTab === "On Hold") return matchSearch && (status === "onhold" || status === "on hold");
    if (activeTab === "Review Needed") return matchSearch && (status === "cancelled" || status === "reviewneeded" || status === "review needed");
    if (activeTab === "Completed") return matchSearch && status === "completed";
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
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', animation: 'fadeUp 300ms ease' }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && <ConfirmDialog message={confirmDlg.message} danger={confirmDlg.danger} confirmLabel={confirmDlg.confirmLabel} onConfirm={confirmDlg.onConfirm} onCancel={() => setConfirmDlg(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', margin: 0, marginBottom: 4 }}>
            Projects
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            {loading ? "Loading..." : `${allProjects.length} project${allProjects.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 12px', height: 36, gap: 8 }}>
            <Search size={14} color="#94A3B8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent', width: isMobile ? 100 : 180, fontFamily: 'inherit' }} />
          </div>
          <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={() => navigate("/newproject")}>
            New Project
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E5E7EB', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: '12px 4px 12px', marginRight: 20,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === t ? 600 : 400,
              color: activeTab === t ? '#5B5CEB' : '#64748B',
              borderBottom: activeTab === t ? '2px solid #5B5CEB' : '2px solid transparent',
              transition: 'all 150ms', whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={fetchProjects} style={{ background: 'transparent', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 12px', color: '#DC2626', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <SkeletonLine width="40%" height={20} />
              <div style={{ height: 8 }} />
              <SkeletonLine width="60%" height={14} />
            </div>
          ))}
        </div>
      )}

      {/* Project list */}
      {!loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>Active Builds</h2>
            <Badge variant="info">{allProjects.length} {allProjects.length === 1 ? 'Site' : 'Sites'}</Badge>
          </div>

          {filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {filtered.map(p => {
                const sk = statusKey(p.status);
                const st = STATUS_STYLE[sk] || STATUS_STYLE.inprogress;
                const spent = p.spentAmount || 0;
                const budget = p.totalBudget || p.budget?.total || 0;
                const progress = p.progress ?? (budget > 0 ? Math.min(spent / budget, 1) : 0);
                return (
                  <div key={p._id}
                    style={{
                      background: '#fff', borderRadius: 12,
                      border: '1px solid #E5E7EB', padding: '20px 24px',
                      cursor: 'pointer', transition: 'box-shadow 150ms ease, transform 150ms ease',
                    }}
                    className="hover-lift-sm"
                    onClick={() => navigate("/managesite", { state: { project: p } })}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em' }}>{p.projectName}</h3>
                      <Badge variant={sk === 'inprogress' ? 'success' : sk === 'onhold' ? 'warning' : sk === 'completed' ? 'info' : 'default'} size="sm">
                        {st.label}
                      </Badge>
                    </div>

                    {p.location && (
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building2 size={13} />
                        {p.location}
                      </div>
                    )}

                    <div style={{ fontSize: 13, fontWeight: 600, color: '#5B5CEB', marginBottom: 14 }}>
                      ₹{spent.toLocaleString("en-IN")} of ₹{budget.toLocaleString("en-IN")}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#5B5CEB' }}>{Math.round(progress * 100)}%</span>
                    </div>
                    <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: '#5B5CEB', borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>

                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#5B5CEB' }}>View Details</span>
                      <ArrowRight size={14} color="#5B5CEB" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748B', fontSize: 14 }}>
              {allProjects.length === 0
                ? 'No projects yet. Click "New Project" to get started.'
                : 'No projects match your search.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
