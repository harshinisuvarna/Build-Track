import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const allWorkers = [
  { id: "#BT-2024-001", name: "John Doe",       initials: "JD", role: "Foreman",      status: "Active",   wages: "₹4,500.00" },
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

const ITEMS_PER_PAGE = 7;

const avatarColors = {
  JD: "#fff5f0", JS: "#fff5f0", MR: "#fff0f0", HS: "#fff5f0",
  LL: "#fff5f0", RZ: "#f0f9ff", DP: "#fff0f0", MW: "#fff5f0",
  TH: "#fff5f0", SS: "#fff5f0", KH: "#fff0f0", ND: "#fff5f0",
};
const avatarText = {
  MR: "#dc2626", DP: "#dc2626", KH: "#dc2626",
};

export default function WorkerDirectory() {
  const navigate = useNavigate();
  const [filter,      setFilter]      = useState("All Workers");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);   // ← NEW
  const filterRef = useRef(null);                          // ← NEW (close on outside click)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close filter dropdown when clicking outside  ← NEW
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleFilter = (f) => { setFilter(f); setPage(1); setShowFilters(false); };  // ← closes dropdown after pick
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  // ── Export CSV ── ← NEW
  const exportWorkers = () => {
    const header = "Name,Role,Status,Total Wages\n";
    const rows   = filtered.map(w => `${w.name},${w.role},${w.status},${w.wages}`).join("\n");
    const blob   = new Blob([header + rows], { type: "text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href       = url;
    a.download   = "workers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", height: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8", overflow: "hidden",
    }}>

      {/* Top Bar */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Worker Directory</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Manage and track your field personnel</p>
        </div>
        <button
          onClick={() => navigate("/newworker")}
          style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
        >
          👤+ Add Worker
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Search + Filter Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 14px", gap: 8 }}>
            <span style={{ color: "#aaa" }}>🔍</span>
            <input
              value={search} onChange={handleSearch}
              placeholder="Search by name, role, or worker ID..."
              style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 160 : 260 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>

            {/* ── Filters button + dropdown ── */}
            <div ref={filterRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: "8px 14px", background: showFilters ? "#ea580c" : "#f5f5f5",
                  border: `1px solid ${showFilters ? "#ea580c" : "#e5e5e5"}`,
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", color: showFilters ? "#fff" : "#555",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                ≡ Filters
              </button>

              {/* Dropdown panel */}
              {showFilters && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "#fff", border: "1px solid #e5e5e5",
                  borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  padding: "8px", zIndex: 100, minWidth: 180,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", padding: "6px 10px 4px", letterSpacing: "0.06em" }}>FILTER BY</div>
                  {[
                    { label: "All Workers",      dot: null },
                    { label: "Active",           dot: "#16a34a" },
                    { label: "Inactive",         dot: "#aaa" },
                    { label: "High Wage (>₹5k)", dot: "#ea580c" },
                  ].map(({ label, dot }) => (
                    <button
                      key={label}
                      onClick={() => handleFilter(label)}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 10px",
                        background: filter === label ? "#fff5f0" : "transparent",
                        border: "none", borderRadius: 8, fontSize: 13,
                        fontWeight: filter === label ? 700 : 500,
                        color: filter === label ? "#ea580c" : "#444",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />}
                      {!dot && <span style={{ width: 7, height: 7, display: "inline-block", flexShrink: 0 }} />}
                      {label}
                      {filter === label && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Export button ── */}
            <button
              onClick={exportWorkers}
              style={{ padding: "8px 14px", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}
            >
              ⬇ Export
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["All Workers", "Active", "Inactive", "High Wage (>₹5k)"].map((f) => (
            <button key={f} onClick={() => handleFilter(f)}
              style={{
                padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
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
                  {["WORKER NAME", "ROLE", "STATUS", "TOTAL WAGES", "ACTIONS"].map((col) => (
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
                style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", fontWeight: 600, borderColor: page === p ? "#ea580c" : "#e5e5e5", background: page === p ? "#ea580c" : "#fff", color: page === p ? "#fff" : "#555" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#ccc" : "#555", fontWeight: 500 }}>
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}