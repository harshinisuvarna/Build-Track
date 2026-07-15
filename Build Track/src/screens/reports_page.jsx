import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { projectAPI, transactionAPI } from "../api";
import { SpendVsBudgetChart } from "../components/Charts";
import { MetricCard, CategoryBudgetBar } from "../components/MetricCards";

const TYPE_COLORS = {
  Materials: { bg: "#eef2ff", color: "#3730a3" },
  Wages: { bg: "#f0fdf4", color: "#166534" },
  Expense: { bg: "#f5f3ff", color: "#7c3aed" },
  Income: { bg: "#ecfdf5", color: "#047857" },
  Equipment: { bg: "#f5f3ff", color: "#7c3aed" },
};

const PAYMENT_COLORS = {
  Paid: { bg: "#dcfce7", color: "#166534" },
  Partial: { bg: "#fef9c3", color: "#854d0e" },
  Pending: { bg: "#fee2e2", color: "#991b1b" },
  Advance: { bg: "#e0e7ff", color: "#3730a3" },
};

const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "30days", label: "Last 30 Days" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const TYPES = ["All", "Materials", "Wages", "Expense", "Income"];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedType, setSelectedType] = useState("All");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [projRes, txRes] = await Promise.all([
          projectAPI.getAll(),
          transactionAPI.getAll(),
        ]);
        setProjects(projRes.data.projects || []);
        setTransactions(txRes.data.transactions || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === "today") {
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now };
    }
    if (datePreset === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { start, end: now };
    }
    if (datePreset === "month") {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    }
    if (datePreset === "30days") {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return { start, end: now };
    }
    if (datePreset === "year") {
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    }
    if (datePreset === "custom" && startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }
    return { start: null, end: null };
  }, [datePreset, startDate, endDate]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (selectedProject !== "all") {
      list = list.filter(t => (t.project?._id || t.project) === selectedProject);
    }
    if (selectedType !== "All") {
      list = list.filter(t => t.type === selectedType);
    }
    if (dateRange.start) {
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= dateRange.start && d <= dateRange.end;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.brand || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, selectedProject, selectedType, dateRange, search]);

  const stats = useMemo(() => ({
    total: filtered.reduce((s, t) => s + (t.amount || 0), 0),
    material: filtered.filter(t => t.type === "Materials").reduce((s, t) => s + (t.amount || 0), 0),
    labour: filtered.filter(t => t.type === "Wages").reduce((s, t) => s + (t.amount || 0), 0),
    equipment: filtered.filter(t => t.type === "Expense" || t.type === "Equipment").reduce((s, t) => s + (t.amount || 0), 0),
  }), [filtered]);

  const chartData = useMemo(() => {
    const proj = projects.find(p => (p._id || p.id) === selectedProject);
    return [
      { category: "Material", actual: stats.material, budget: proj?.budgetMaterial || proj?.budget?.material || 0 },
      { category: "Labour", actual: stats.labour, budget: proj?.budgetLabour || proj?.budget?.labour || 0 },
      { category: "Equipment", actual: stats.equipment, budget: proj?.budgetEquipment || proj?.budget?.equipment || 0 },
    ];
  }, [selectedProject, stats, projects]);

  const sorted = useMemo(() => {
    const s = [...filtered];
    s.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") cmp = new Date(a.date) - new Date(b.date);
      else if (sortCol === "amount") cmp = (a.amount || 0) - (b.amount || 0);
      else if (sortCol === "type") cmp = (a.type || "").localeCompare(b.type || "");
      else if (sortCol === "title") cmp = (a.title || "").localeCompare(b.title || "");
      return sortAsc ? cmp : -cmp;
    });
    return s;
  }, [filtered, sortCol, sortAsc]);

  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [selectedProject, selectedType, datePreset, startDate, endDate, search]);

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const exportCsv = () => {
    const headers = ["Date", "Description", "Type", "Category", "Amount", "Status", "Payment"];
    const rows = filtered.map(t => [
      t.date ? new Date(t.date).toISOString().split("T")[0] : "",
      t.title || "", t.type || "", t.category || "",
      t.amount || 0, t.approvalStatus || "", t.paymentStatus || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BuildTrack_Report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("BuildTrack Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);
    const projName = selectedProject === "all" ? "All Projects" : projects.find(p => p._id === selectedProject)?.projectName || "";
    doc.text(`Project: ${projName} | Type: ${selectedType} | Period: ${DATE_PRESETS.find(p => p.value === datePreset)?.label || "All"}`, 14, 34);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total: Rs.${stats.total.toLocaleString("en-IN")}  Material: Rs.${stats.material.toLocaleString("en-IN")}  Labour: Rs.${stats.labour.toLocaleString("en-IN")}  Equipment: Rs.${stats.equipment.toLocaleString("en-IN")}`, 14, 44);
    doc.autoTable({
      startY: 50,
      head: [["Date", "Description", "Type", "Amount", "Status"]],
      body: filtered.map(t => [
        t.date ? new Date(t.date).toLocaleDateString("en-IN") : "",
        t.title || "", t.type || "",
        `Rs.${(t.amount || 0).toLocaleString("en-IN")}`, t.paymentStatus || "",
      ]),
      theme: "grid",
      headStyles: { fillColor: [234, 88, 12] },
    });
    doc.save(`BuildTrack_Report_${Date.now()}.pdf`);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "#f9f9f9",
    border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13,
    color: "#1a1a1a", outline: "none", fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14 }}>
          Loading reports…
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Reports & Analytics</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{filtered.length} entries found</p>
        </div>
        <button onClick={() => navigate("/ai-chat")}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          🤖 Ask AI
        </button>
      </div>

      {error && (
        <div style={{ margin: "16px 24px 0", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", color: "#991b1b", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ flex: 1, padding: "20px 24px" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: 16, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>PROJECT</label>
              <div style={{ position: "relative" }}>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                  <option value="all">All Projects</option>
                  {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.projectName}</option>)}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>DATE PERIOD</label>
              <div style={{ position: "relative" }}>
                <select value={datePreset} onChange={e => setDatePreset(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                  {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
              </div>
            </div>
            {datePreset === "custom" && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>START DATE</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>END DATE</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>SEARCH</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 14 }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..." style={{ ...inputStyle, paddingLeft: 34 }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setSelectedType(t)}
                style={{ padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${selectedType === t ? "#ea580c" : "#e5e5e5"}`, background: selectedType === t ? "#ea580c" : "#fff", color: selectedType === t ? "#fff" : "#555", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <MetricCard icon="📊" label="Total Cost" value={stats.total} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budget || projects.find(p => (p._id || p.id) === selectedProject)?.totalBudget || 0} color="#2563eb" />
          <MetricCard icon="🧱" label="Material" value={stats.material} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budgetMaterial || 0} color="#3730a3" />
          <MetricCard icon="👷" label="Labour" value={stats.labour} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budgetLabour || 0} color="#7c3aed" />
          <MetricCard icon="🚜" label="Equipment" value={stats.equipment} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budgetEquipment || 0} color="#0891b2" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>Spend vs Budget</div>
            <SpendVsBudgetChart data={chartData} />
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>Category Breakdown</div>
            <CategoryBudgetBar name="Material" spent={stats.material} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budgetMaterial || 0} color="#3730a3" />
            <CategoryBudgetBar name="Labour" spent={stats.labour} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budgetLabour || 0} color="#7c3aed" />
            <CategoryBudgetBar name="Equipment" spent={stats.equipment} budget={projects.find(p => (p._id || p.id) === selectedProject)?.budgetEquipment || 0} color="#0891b2" />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Transaction Log ({filtered.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportCsv} style={{ padding: "8px 14px", background: "#f3f4f6", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer" }}>📥 CSV</button>
              <button onClick={exportPdf} style={{ padding: "8px 14px", background: "#f3f4f6", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer" }}>📄 PDF</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {[["date", "Date"], ["title", "Description"], ["type", "Type"], ["amount", "Amount"], ["status", "Payment"]].map(([col, label]) => (
                    <th key={col} onClick={() => handleSort(col)}
                      style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                      {label} {sortCol === col ? (sortAsc ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const tc = TYPE_COLORS[t.type] || TYPE_COLORS.Expense;
                  const pc = PAYMENT_COLORS[t.paymentStatus] || PAYMENT_COLORS.Pending;
                  return (
                    <tr key={t._id} style={{ borderBottom: "1px solid #f5f5f5" }}
                      onClick={() => navigate(`/entries/${t._id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9f9f9"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>
                        {t.date ? new Date(t.date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#1a1a1a", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.title || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color }}>{t.type}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: t.type === "Income" ? "#16a34a" : "#dc2626", textAlign: "right" }}>
                        {t.type === "Income" ? "+" : "-"}₹{(t.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: pc.bg, color: pc.color }}>{t.paymentStatus || "—"}</span>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#aaa", fontSize: 14 }}>No entries match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {sorted.length > rowsPerPage && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#888" }}>Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sorted.length)} of {sorted.length}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e5e5", background: "#fff", fontSize: 12, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}>← Prev</button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e5e5", background: "#fff", fontSize: 12, cursor: currentPage >= totalPages ? "not-allowed" : "pointer", opacity: currentPage >= totalPages ? 0.5 : 1 }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
