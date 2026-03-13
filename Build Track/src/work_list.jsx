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

const allWorkers = [
  { id: "#BT-2024-001", name: "John Doe",      initials: "JD", role: "Foreman",      status: "Active",   wages: "₹4,500.00" },
  { id: "#BT-2024-042", name: "Jane Smith",     initials: "JS", role: "Electrician",  status: "Active",   wages: "₹3,800.00" },
  { id: "#BT-2024-118", name: "Mike Ross",      initials: "MR", role: "Laborer",      status: "Inactive", wages: "₹2,200.00" },
  { id: "#BT-2024-002", name: "Harvey Specter", initials: "HS", role: "Site Manager", status: "Active",   wages: "₹6,000.00" },
  { id: "#BT-2024-088", name: "Louis Litt",     initials: "LL", role: "Plumber",      status: "Active",   wages: "₹4,100.00" },
  { id: "#BT-2024-055", name: "Rachel Zane",    initials: "RZ", role: "Architect",    status: "Active",   wages: "₹5,200.00" },
  { id: "#BT-2024-077", name: "Donna Paulsen",  initials: "DP", role: "Supervisor",   status: "Inactive", wages: "₹3,100.00" },
  { id: "#BT-2024-033", name: "Mike Wheeler",   initials: "MW", role: "Welder",       status: "Active",   wages: "₹3,600.00" },
  { id: "#BT-2024-099", name: "Tom Hardy",      initials: "TH", role: "Carpenter",    status: "Active",   wages: "₹2,900.00" },
  { id: "#BT-2024-011", name: "Sara Sidle",     initials: "SS", role: "Engineer",     status: "Active",   wages: "₹5,800.00" },
  { id: "#BT-2024-066", name: "Kevin Hart",     initials: "KH", role: "Painter",      status: "Inactive", wages: "₹1,900.00" },
  { id: "#BT-2024-044", name: "Nina Dobrev",    initials: "ND", role: "Inspector",    status: "Active",   wages: "₹4,700.00" },
];

const ITEMS_PER_PAGE = 5;

const avatarColors = {
  JD: "#fff5f0", JS: "#fff5f0", MR: "#fff0f0", HS: "#fff5f0",
  LL: "#fff5f0", RZ: "#f0f9ff", DP: "#fff0f0", MW: "#fff5f0",
  TH: "#fff5f0", SS: "#fff5f0", KH: "#fff0f0", ND: "#fff5f0",
};
const avatarText = {
  MR: "#dc2626", DP: "#dc2626", KH: "#dc2626",
};

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

export default function WorkerDirectory() {
  const [activeNav,   setActiveNav]   = useState("Workers");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter,      setFilter]      = useState("All Workers");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filtered = allWorkers.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase());
    if (filter === "Active")           return matchSearch && w.status === "Active";
    if (filter === "Inactive")         return matchSearch && w.status === "Inactive";
    if (filter === "High Wage (>₹5k)") return matchSearch && parseFloat(w.wages.replace(/[₹,]/g, "")) > 5000;
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilter = (f) => { setFilter(f); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

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

        {/* ── Logo (replaced) ── */}
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
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Worker Directory</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Manage and track your field personnel</p>
            </div>
          </div>
          <button style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            👤+ Add Worker
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Search + Filter Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 14px", gap: 8, minWidth: 220 }}>
              <span style={{ color: "#aaa" }}>🔍</span>
              <input value={search} onChange={handleSearch}
                placeholder="Search by name, role, or worker ID..."
                style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 140 : 240 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "8px 14px", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}>≡ Filters</button>
              <button style={{ padding: "8px 14px", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}>⬇ Export</button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["All Workers", "Active", "Inactive", "High Wage (>₹5k)"].map((f) => (
              <button key={f} onClick={() => handleFilter(f)}
                style={{
                  padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  background:  filter === f ? "#ea580c" : "#fff",
                  color:       filter === f ? "#fff"    : "#555",
                  borderColor: filter === f ? "#ea580c" : "#e5e5e5",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {f === "Active"   && <span style={{ width: 7, height: 7, borderRadius: "50%", background: filter === f ? "#fff" : "#16a34a", display: "inline-block" }} />}
                {f === "Inactive" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: filter === f ? "#fff" : "#aaa",     display: "inline-block" }} />}
                {f}
              </button>
            ))}
          </div>

          {/* Table Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

            {/* Desktop Table */}
            {!isMobile && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {["WORKER NAME","ROLE","STATUS","TOTAL WAGES","ACTIONS"].map((col) => (
                      <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((w) => (
                    <tr key={w.id} style={{ borderBottom: "1px solid #f9f9f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: avatarColors[w.initials] || "#fff5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: avatarText[w.initials] || "#ea580c" }}>{w.initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{w.name}</div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>{w.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#444" }}>{w.role}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: w.status === "Active" ? "#dcfce7" : "#fee2e2", color: w.status === "Active" ? "#166534" : "#991b1b" }}>{w.status}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{w.wages}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                          <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>👁️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Mobile Cards */}
            {isMobile && (
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {paginated.map((w) => (
                  <div key={w.id} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: avatarColors[w.initials] || "#fff5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: avatarText[w.initials] || "#ea580c" }}>{w.initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{w.id}</div>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: w.status === "Active" ? "#dcfce7" : "#fee2e2", color: w.status === "Active" ? "#166534" : "#991b1b" }}>{w.status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>Role</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{w.role}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#aaa" }}>Total Wages</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{w.wages}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 13 }}>✏️</button>
                        <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 13 }}>👁️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#888" }}>
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} workers
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#ccc" : "#555", fontWeight: 500 }}>
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", fontWeight: 600, transition: "all 0.15s", borderColor: page === p ? "#ea580c" : "#e5e5e5", background: page === p ? "#ea580c" : "#fff", color: page === p ? "#fff" : "#555" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#ccc" : "#555", fontWeight: 500 }}>
                Next
              </button>
            </div>
          </div>

        </div>{/* /body */}
      </div>{/* /main */}
    </div>
  );
}