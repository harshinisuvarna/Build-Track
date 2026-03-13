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

const transactions = [
  { date: "Oct 24, 2023", description: "Rahul Sharma - Daily Wage",        category: "Wages",    project: "Skyline Tower",      amount: -1200   },
  { date: "Oct 23, 2023", description: "Cement Procurement (50 Bags)",     category: "Expenses", project: "Green Valley",        amount: -45000  },
  { date: "Oct 22, 2023", description: "Client Advance Payment",           category: "Income",   project: "Skyline Tower",      amount: 150000  },
  { date: "Oct 21, 2023", description: "Amit Kumar - Overtime",            category: "Wages",    project: "City Center",         amount: -800    },
  { date: "Oct 20, 2023", description: "TMT Steel Rods (2 Tons)",          category: "Expenses", project: "Green Valley",        amount: -32000  },
  { date: "Oct 19, 2023", description: "Site Survey Fees",                 category: "Expenses", project: "Ocean Front Estate",  amount: -15000  },
  { date: "Oct 18, 2023", description: "Lumber Supply",                    category: "Expenses", project: "Skyline Tower",      amount: -8500   },
  { date: "Oct 17, 2023", description: "Maintenance Bonus - All Workers",  category: "Wages",    project: "City Center",         amount: -22000  },
  { date: "Oct 16, 2023", description: "Milestone 1 Payment",              category: "Income",   project: "Green Valley",        amount: 280000  },
  { date: "Oct 15, 2023", description: "Suresh G. - Daily Wage",           category: "Wages",    project: "Skyline Tower",      amount: -1200   },
  { date: "Oct 14, 2023", description: "Plumbing Materials",               category: "Expenses", project: "Ocean Front Estate",  amount: -9800   },
  { date: "Oct 13, 2023", description: "Phase 2 Client Payment",           category: "Income",   project: "City Center",         amount: 200000  },
  { date: "Oct 12, 2023", description: "Ravi S. - Daily Wage",             category: "Wages",    project: "Green Valley",        amount: -1100   },
  { date: "Oct 11, 2023", description: "Electrical Wiring Supply",         category: "Expenses", project: "Skyline Tower",      amount: -18500  },
  { date: "Oct 10, 2023", description: "Priya K. - Overtime",              category: "Wages",    project: "City Center",         amount: -950    },
];

const ITEMS_PER_PAGE = 10;

const categoryStyle = {
  Wages:    { bg: "#fce7f3", color: "#9d174d" },
  Expenses: { bg: "#fef3c7", color: "#92400e" },
  Income:   { bg: "#dcfce7", color: "#166534" },
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

export default function TransactionLog() {
  const [activeNav,   setActiveNav]   = useState("Log");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter,      setFilter]      = useState("All");
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

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.project.toLowerCase().includes(search.toLowerCase());
    if (filter !== "All") return matchSearch && t.category === filter;
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const monthlyIncome   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netBalance      = monthlyIncome - monthlyExpenses;

  const fmt = (n) => "₹ " + Math.abs(n).toLocaleString("en-IN");

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page, "...", totalPages];
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8", overflow: "hidden" }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: 230, background: "#fff",
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
        <div style={{ padding: 12, flex: 1 }}>
          {navItems.map((item) => (
            <button key={item.label}
              onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: activeNav === item.label ? "#fff5f0" : "transparent",
                color:      activeNav === item.label ? "#ea580c" : "#555",
                fontWeight: activeNav === item.label ? 600 : 400,
                fontSize: 14, marginBottom: 2, textAlign: "left", transition: "all 0.15s",
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

        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Transaction Log</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Manage and track all construction-related financial entries.</p>
            </div>
          </div>
          <button style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            + New Entry
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Filter + Search Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {["All", "Wages", "Expenses", "Income"].map((f) => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  style={{
                    padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    background:  filter === f ? "#ea580c" : "#fff",
                    color:       filter === f ? "#fff"    : "#555",
                    borderColor: filter === f ? "#ea580c" : "#e5e5e5",
                  }}>{f}</button>
              ))}
              <button style={{ padding: "7px 16px", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}>
                ⬇ Export
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 14px", gap: 8 }}>
              <span style={{ color: "#aaa" }}>🔍</span>
              <input value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search worker, project..."
                style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 130 : 200 }} />
            </div>
          </div>

          {/* Table Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

            {/* Desktop Table */}
            {!isMobile && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {["DATE", "DESCRIPTION", "CATEGORY", "PROJECT", "AMOUNT (₹)"].map((col, i) => (
                      <th key={col} style={{ padding: "13px 20px", textAlign: i === 4 ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>No entries found</td></tr>
                  ) : paginated.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>{t.date}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#1a1a1a", fontWeight: 500 }}>{t.description}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: categoryStyle[t.category].bg, color: categoryStyle[t.category].color }}>{t.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#555" }}>{t.project}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right", fontSize: 14, fontWeight: 700, color: t.amount > 0 ? "#16a34a" : "#dc2626" }}>
                        {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Mobile Cards */}
            {isMobile && (
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {paginated.length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 14 }}>No entries found</div>
                ) : paginated.map((t, i) => (
                  <div key={i} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginBottom: 2 }}>{t.description}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{t.date}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.amount > 0 ? "#16a34a" : "#dc2626" }}>
                        {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: categoryStyle[t.category].bg, color: categoryStyle[t.category].color }}>{t.category}</span>
                      <span style={{ fontSize: 12, color: "#666" }}>{t.project}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>
                Showing <strong>{Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}</strong>–<strong>{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
              </span>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#ccc" : "#555", fontSize: 16 }}>‹</button>
                {getPages().map((p, i) => (
                  <button key={i} onClick={() => typeof p === "number" && setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid", fontSize: 13, cursor: typeof p === "number" ? "pointer" : "default", fontWeight: 600, borderColor: page === p ? "#ea580c" : "#e5e5e5", background: page === p ? "#ea580c" : "#fff", color: page === p ? "#fff" : "#555" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#ccc" : "#555", fontSize: 16 }}>›</button>
              </div>
            </div>
          </div>

          {/* Summary Footer */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "18px 22px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.08em", marginBottom: 8 }}>MONTHLY INCOME</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#15803d" }}>{fmt(monthlyIncome)}</div>
            </div>
            <div style={{ background: "#fff7f0", borderRadius: 14, padding: "18px 22px", border: "1px solid #fed7aa" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", letterSpacing: "0.08em", marginBottom: 8 }}>MONTHLY EXPENSES</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#c2410c" }}>{fmt(monthlyExpenses)}</div>
            </div>
            <div style={{ background: "#fff5f0", borderRadius: 14, padding: "18px 22px", border: "1.5px solid #ea580c" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", letterSpacing: "0.08em", marginBottom: 8 }}>NET BALANCE</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>{fmt(netBalance)}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}