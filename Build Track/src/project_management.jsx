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

const allProjects = [
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
  { label: "All Projects", count: 12 },
  { label: "Active",       count: 8  },
  { label: "Review Needed",count: 2  },
  { label: "Completed",    count: 24 },
];

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
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function ProjectsPage() {
  const [activeNav,   setActiveNav]   = useState("Projects");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [activeTab,   setActiveTab]   = useState("All Projects");
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Active Projects</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Monitor construction progress and financial health across all sites.</p>
            </div>
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
            <button style={{
              padding: "10px 20px", background: "#ea580c", color: "#fff",
              border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
              + New Project
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "0 24px", display: "flex", gap: 4, flexShrink: 0 }}>
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

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
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
                  <button style={{
                    flex: 1, padding: "12px 0", background: "#1a1a1a", color: "#fff",
                    border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#333"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}>
                    Manage Site
                  </button>
                  <button style={{
                    width: 44, height: 44, background: "#fff", border: "1px solid #e5e5e5",
                    borderRadius: 10, cursor: "pointer", fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    📄
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}