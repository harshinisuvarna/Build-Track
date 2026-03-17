import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const initialProjects = [
  {
    id: 1,
    name: "Skyline Tower",
    manager: "Rajesh Kumar",
    status: "ON TRACK",
    statusBg: "#dcfce7", statusColor: "#166534",
    progress: 75,
    budget: "₹12.5 Cr", spent: "₹9.2 Cr", remaining: "₹3.3 Cr",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&h=120&fit=crop",
    tab: "Active",
  },
  {
    id: 2,
    name: "Green Valley Phase II",
    manager: "Ananya Singh",
    status: "IN PROGRESS",
    statusBg: "#fef9c3", statusColor: "#854d0e",
    progress: 42,
    budget: "₹8.4 Cr", spent: "₹3.1 Cr", remaining: "₹5.3 Cr",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&h=120&fit=crop",
    tab: "Active",
  },
  {
    id: 3,
    name: "Harbor Bridge Renovation",
    manager: "David Wilson",
    status: "REVIEW NEEDED",
    statusBg: "#fee2e2", statusColor: "#991b1b",
    progress: 15,
    budget: "₹4.2 Cr", spent: "₹0.8 Cr", remaining: "₹3.4 Cr",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=120&h=120&fit=crop",
    tab: "Review Needed",
  },
  {
    id: 4,
    name: "Lotus Plaza Mall",
    manager: "Vikram Roy",
    status: "ON TRACK",
    statusBg: "#dcfce7", statusColor: "#166534",
    progress: 92,
    budget: "₹25.0 Cr", spent: "₹23.5 Cr", remaining: "₹1.5 Cr",
    image: "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=120&h=120&fit=crop",
    tab: "Active",
  },
  {
    id: 5,
    name: "Sunset Villas",
    manager: "Mike R.",
    status: "COMPLETED",
    statusBg: "#e0e7ff", statusColor: "#3730a3",
    progress: 100,
    budget: "₹4.1 Cr", spent: "₹4.1 Cr", remaining: "₹0 Cr",
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=120&h=120&fit=crop",
    tab: "Completed",
  },
  {
    id: 6,
    name: "Metro Bridge Hub",
    manager: "Emma W.",
    status: "IN PROGRESS",
    statusBg: "#fef9c3", statusColor: "#854d0e",
    progress: 12,
    budget: "₹18.0 Cr", spent: "₹2.1 Cr", remaining: "₹15.9 Cr",
    image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=120&h=120&fit=crop",
    tab: "Active",
  },
];

const tabs = [
  { label: "All Projects",  count: 12 },
  { label: "Active",        count: 8  },
  { label: "Review Needed", count: 2  },
  { label: "Completed",     count: 24 },
];

export default function ProjectsPage() {
  const navigate = useNavigate();

  // ── Projects in state so deletes reflect immediately ── ← NEW
  const [allProjects, setAllProjects] = useState(initialProjects);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [activeTab,   setActiveTab]   = useState("All Projects");
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Delete handler ── ← NEW
  const handleDelete = (projectId, projectName) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${projectName}"?`);
    if (confirmed) {
      setAllProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const filtered = allProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.manager.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "All Projects")  return matchSearch;
    if (activeTab === "Active")        return matchSearch && p.tab === "Active";
    if (activeTab === "Review Needed") return matchSearch && p.tab === "Review Needed";
    if (activeTab === "Completed")     return matchSearch && p.tab === "Completed";
    return matchSearch;
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8",
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Active Projects</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Monitor construction progress and financial health across all sites.</p>
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
        {tabs.map((t) => (
          <button key={t.label} onClick={() => setActiveTab(t.label)}
            style={{
              padding: "14px 4px", marginRight: 20,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: activeTab === t.label ? 600 : 400,
              color: activeTab === t.label ? "#ea580c" : "#777",
              borderBottom: activeTab === t.label ? "2.5px solid #ea580c" : "2.5px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                <img src={p.image} alt={p.name}
                  style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{p.name}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: p.statusBg, color: p.statusColor, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#777" }}>Manager: <span style={{ color: "#444", fontWeight: 500 }}>{p.manager}</span></div>
                </div>
                <span style={{ color: "#ccc", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>⋮</span>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Project Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>{p.progress}%</span>
                </div>
                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${p.progress}%`, height: "100%", background: "#ea580c", borderRadius: 4, transition: "width 0.4s ease" }} />
                </div>
              </div>

              {/* Budget Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18, background: "#fafafa", borderRadius: 10, padding: "12px 14px" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 4 }}>TOTAL BUDGET</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{p.budget}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 4 }}>SPENT SO FAR</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{p.spent}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 4 }}>REMAINING</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{p.remaining}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => navigate("/managesite")}
                  style={{
                    flex: 1, padding: "12px 0", background: "#1a1a1a", color: "#fff",
                    border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#333"}
                  onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}>
                  Manage Site
                </button>

                {/* ── Delete button — icon changed 📄 → 🗑️, onClick added ── ← CHANGED */}
                <button
                  onClick={() => handleDelete(p.id, p.name)}
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
          ))}

          {/* Empty state when all projects deleted or none match search */}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
              No projects found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}