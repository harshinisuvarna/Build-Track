import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { reportAPI, transactionAPI } from "../api";
import { Toast } from "../components/Toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { colors, radius, shadows, gradients, typography } from "../styles/designTokens";

const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);
const now = new Date();
const THIS_YEAR = now.getFullYear();
const THIS_MONTH = now.getMonth();

function formatINR(n) { return `\u20B9${Number(n || 0).toLocaleString("en-IN")}`; }
function formatShortDate(d) { return d ? `${SHORT_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}` : ""; }
function fullMonthRange(y, m) { return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) }; }

const TABS = [
  { key: "all", label: "All" },
  { key: "materials", label: "Materials" },
  { key: "labour", label: "Labour" },
  { key: "equipment", label: "Equipment" },
];

export default function FinancialReportPage() {
  const navigate = useNavigate();
  const [selYear, setSelYear] = useState(THIS_YEAR);
  const [selMonth, setSelMonth] = useState(THIS_MONTH);
  const [reportData, setReportData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [showMonthDrop, setShowMonthDrop] = useState(false);
  const [dropYear, setDropYear] = useState(THIS_YEAR);
  const [showCal, setShowCal] = useState(false);
  const [calYear, setCalYear] = useState(THIS_YEAR);
  const [calMonth, setCalMonth] = useState(THIS_MONTH);
  const [rangeStart, setRangeStart] = useState(fullMonthRange(THIS_YEAR, THIS_MONTH).start);
  const [rangeEnd, setRangeEnd] = useState(fullMonthRange(THIS_YEAR, THIS_MONTH).end);
  const [pickingStart, setPickingStart] = useState(true);
  const [hoverDay, setHoverDay] = useState(null);
  const [sortKey, setSortKey] = useState("name");
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);
  const monthDropRef = useRef(null);
  const calRef = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (monthDropRef.current && !monthDropRef.current.contains(e.target)) setShowMonthDrop(false);
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    const params = { year: selYear, month: selMonth };
    if (rangeStart) params.rangeStart = rangeStart.toISOString();
    if (rangeEnd) params.rangeEnd = rangeEnd.toISOString();
    Promise.all([
      reportAPI.getFinancial(params).catch(() => ({ data: {} })),
      transactionAPI.getAll({ ...params, limit: 200 }).catch(() => ({ data: { transactions: [] } })),
    ]).then(([finRes, txRes]) => {
      if (!mounted) return;
      setReportData(finRes.data);
      setEntries(txRes.data.transactions || []);
    }).catch(() => { if (mounted) setError("Failed to load report data"); })
    .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [selYear, selMonth, rangeStart?.getTime(), rangeEnd?.getTime()]);

  const { income = 0, expenses = 0, profit = 0, compliance = 0 } = reportData || {};
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : "0.0";

  const materialTotal = entries.filter(e => (e.type || "").toLowerCase() === "materials" || (e.category || "").toLowerCase() === "material").reduce((s, e) => s + (e.amount || 0), 0);
  const labourTotal = entries.filter(e => (e.type || "").toLowerCase() === "wages" || (e.category || "").toLowerCase() === "labour").reduce((s, e) => s + (e.amount || 0), 0);
  const equipmentTotal = entries.filter(e => (e.type || "").toLowerCase() === "equipment").reduce((s, e) => s + (e.amount || 0), 0);
  const grandTotal = materialTotal + labourTotal + equipmentTotal;

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const tabKey = TABS[activeTab]?.key;
    const matchSearch = !q || (e.title || "").toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q);
    const type = (e.type || "").toLowerCase();
    const cat = (e.category || "").toLowerCase();
    if (tabKey === "all") return matchSearch;
    if (tabKey === "materials") return matchSearch && (type === "materials" || cat === "material");
    if (tabKey === "labour") return matchSearch && (type === "wages" || cat === "labour");
    if (tabKey === "equipment") return matchSearch && (type === "equipment" || cat === "equipment");
    return matchSearch;
  }).sort((a, b) => {
    if (sortKey === "amount") return (b.amount || 0) - (a.amount || 0);
    return (a.title || "").localeCompare(b.title || "");
  });

  const handleExportCSV = () => {
    try {
      setExporting(true);
      const header = "Title,Type,Amount,Date\n";
      const rows = filtered.map(e => `"${(e.title || "").replace(/"/g, '""')}","${(e.type || "").replace(/"/g, '""')}",${e.amount || 0},"${e.date ? new Date(e.date).toLocaleDateString("en-IN") : ""}"`).join("\n");
      const url = URL.createObjectURL(new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a"); a.href = url; a.download = `report-${SHORT_MONTHS[selMonth]}-${selYear}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      setToast({ msg: "CSV exported!", type: "success" });
    } catch { setToast({ msg: "Export failed", type: "error" }); }
    finally { setExporting(false); }
  };

  const handleDownloadPDF = () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text(`Report - ${MONTH_NAMES[selMonth]} ${selYear}`, 14, 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      doc.text(`Income: ${formatINR(income)}`, 14, 28);
      doc.text(`Expenses: ${formatINR(expenses)}`, 74, 28);
      doc.text(`Net: ${formatINR(profit)}`, 140, 28);
      const body = filtered.length ? filtered.map(e => [e.title || "\u2014", e.type || "\u2014", `\u20B9${(e.amount || 0).toLocaleString("en-IN")}`, e.date ? new Date(e.date).toLocaleDateString("en-IN") : "\u2014"]) : [["No data"]];
      autoTable(doc, { startY: 36, head: [["Title", "Type", "Amount", "Date"]], body, styles: { fontSize: 9 }, headStyles: { fillColor: [23, 62, 234], textColor: 255 } });
      doc.save(`report-${SHORT_MONTHS[selMonth]}-${selYear}.pdf`);
      setToast({ msg: "PDF downloaded!", type: "success" });
    } catch { setToast({ msg: "PDF failed", type: "error" }); }
    finally { setExporting(false); }
  };

  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", background: colors.bgBase4, fontFamily: typography.fontFamily }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />

      {/* Top Bar */}
      <div style={{ background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>Reports</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textLight }}>Financial overview &amp; transaction log</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/ai-chat")}
            style={{
              padding: "9px 18px", borderRadius: radius.sm, border: "none",
              background: gradients.primaryButton, color: "#FFF",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Ask AI
          </button>
          <button onClick={handleExportCSV} disabled={exporting}
            style={{ padding: "9px 18px", borderRadius: radius.sm, border: `1.5px solid ${colors.primaryBlue}`, background: "transparent", color: colors.primaryBlue, fontWeight: 600, fontSize: 13, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.6 : 1 }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {/* Filter Card */}
        <div style={{ background: colors.cardBg, borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`, padding: "16px 20px", marginBottom: 20, boxShadow: shadows.card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: colors.bgBase4, borderRadius: radius.sm, padding: "9px 14px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..." style={{ border: "none", outline: "none", fontSize: 13, color: colors.textPrimary, background: "transparent", width: "100%" }} />
          </div>

          {/* Month selector */}
          <div ref={monthDropRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowMonthDrop(v => !v); setShowCal(false); }}
              style={{ padding: "9px 18px", borderRadius: radius.sm, border: `1.5px solid ${colors.primaryBlue}`, background: "transparent", color: colors.primaryBlue, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {monthLabel} <span style={{ fontSize: 10 }}>&#x25BE;</span>
            </button>
            {showMonthDrop && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: radius.md, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 200, width: 240, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${colors.divider}` }}>
                  <button onClick={() => setDropYear(y => Math.max(2020, y - 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: colors.textPrimary }}>&#x2039;</button>
                  <span style={{ fontWeight: 700, fontSize: 14, color: colors.textPrimary }}>{dropYear}</span>
                  <button onClick={() => setDropYear(y => Math.min(2030, y + 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: colors.textPrimary }}>&#x203A;</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, padding: "12px" }}>
                  {MONTH_NAMES.map((name, mi) => {
                    const active = dropYear === selYear && mi === selMonth;
                    return (
                      <button key={name} onClick={() => { setSelYear(dropYear); setSelMonth(mi); const r = fullMonthRange(dropYear, mi); setRangeStart(r.start); setRangeEnd(r.end); setCalYear(dropYear); setCalMonth(mi); setShowMonthDrop(false); }}
                        style={{ padding: "8px 4px", fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#FFF" : colors.textPrimary, background: active ? gradients.primaryButton : colors.bgBase4, border: "none", borderRadius: radius.sm, cursor: "pointer" }}>
                        {SHORT_MONTHS[mi]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Date range */}
          <div ref={calRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowCal(v => !v); setShowMonthDrop(false); }}
              style={{ padding: "9px 18px", borderRadius: radius.sm, border: `1.5px solid ${colors.cardBorder}`, background: "transparent", color: colors.textPrimary, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {formatShortDate(rangeStart)} - {formatShortDate(rangeEnd)}
            </button>
          </div>

          <button onClick={handleDownloadPDF} disabled={exporting}
            style={{ padding: "9px 20px", borderRadius: radius.sm, border: "none", background: gradients.primaryButton, color: "#FFF", fontWeight: 700, fontSize: 13, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            {exporting ? "Downloading..." : "Download PDF"}
          </button>
        </div>

        {/* Cost Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.primaryLightBlue})`,
            borderRadius: radius.lg, padding: "18px 20px", boxShadow: shadows.card,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" style={{ marginBottom: 8 }}><path d="M11 17h2v-1h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-3V8h4V6h-2V5h-2v1h-1a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1H9v2h2v1z" /></svg>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#FFF", marginBottom: 2 }}>{formatINR(grandTotal)}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>Total Cost</div>
          </div>
          <CostCard label="Materials" value={materialTotal} color="#5B5FCF" icon="M3 3h18v18H3z" />
          <CostCard label="Labour" value={labourTotal} color={colors.primaryPurple} icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <CostCard label="Equipment" value={equipmentTotal} color={colors.primaryLightBlue} icon="M4 8h16v12H4z" />
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, background: colors.cardBg, borderRadius: radius.sm, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(i)}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                background: activeTab === i ? colors.primaryBlue : "transparent",
                color: activeTab === i ? "#FFF" : colors.textSecondary,
                fontWeight: activeTab === i ? 700 : 500, fontSize: 13,
                transition: "all 0.15s",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${colors.bgBase4}`, borderTopColor: colors.primaryBlue, animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: colors.textLight }}>Loading report...</div>
          </div>
        ) : (
          <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: colors.bgBase4 }}>
                    <th style={thStyle}>TITLE</th>
                    <th style={thStyle}>TYPE</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => setSortKey(sortKey === "amount" ? "name" : "amount")}>
                      AMOUNT {sortKey === "amount" ? "\u25B2" : "\u25B4"}
                    </th>
                    <th style={thStyle}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: colors.textLight, fontSize: 13 }}>No entries found for this period.</td></tr>
                  ) : filtered.map((e, i) => {
                    const type = (e.type || "").toLowerCase();
                    const chipColor = type === "materials" || type === "material" ? "#5B5FCF" : type === "wages" || type === "labour" ? colors.primaryPurple : type === "equipment" ? colors.primaryLightBlue : colors.textLight;
                    const chipBg = type === "materials" || type === "material" ? `${colors.primaryBlue}10` : type === "wages" || type === "labour" ? `${colors.primaryPurple}10` : type === "equipment" ? `${colors.primaryLightBlue}10` : colors.bgBase4;
                    return (
                      <tr key={e._id || i} style={{ borderBottom: `1px solid ${colors.bgBase4}` }}
                        onMouseEnter={ev => ev.currentTarget.style.background = colors.bgBase4}
                        onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                        <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary }}>{e.title || "\u2014"}</span></td>
                        <td style={tdStyle}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: chipBg, color: chipColor }}>{(e.type || e.category || "Expense").toUpperCase()}</span></td>
                        <td style={{ ...tdStyle, textAlign: "right" }}><span style={{ fontWeight: 700, color: colors.textPrimary, fontSize: 14 }}>{formatINR(e.amount)}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: 12, color: colors.textLight }}>{e.date ? new Date(e.date).toLocaleDateString("en-IN") : "\u2014"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: colors.textLight }}>{filtered.length} entries</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={handleExportCSV} disabled={exporting || filtered.length === 0}
                  style={{ padding: "6px 14px", borderRadius: radius.sm, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.primaryBlue, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: "12px 18px", fontSize: 11, fontWeight: 700, color: colors.textLight, letterSpacing: "0.06em", textAlign: "left", whiteSpace: "nowrap" };
const tdStyle = { padding: "14px 18px", fontSize: 13, color: colors.textPrimary };

function CostCard({ label, value, color, icon }) {
  return (
    <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: "18px 20px", boxShadow: shadows.card }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d={icon} /></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.3px", marginBottom: 2 }}>{formatINR(value)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: colors.textLight }}>{label}</div>
    </div>
  );
}
