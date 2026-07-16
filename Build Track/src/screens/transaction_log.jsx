import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { transactionAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";
import { colors, radius, shadows, gradients, typography } from "../styles/designTokens";

const ITEMS_PER_PAGE = 10;

const TYPE_STYLES = {
  Materials: { bg: "#ECEBFF", color: "#6C63FF", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M10 12h4" },
  Wages:     { bg: "#E8F5E9", color: "#2E7D32", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3z" },
  Expense:   { bg: "#FFF3E0", color: "#E65100", icon: "M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z" },
  Income:    { bg: "#F0FDF4", color: "#15803D", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
};

const FILTERS = [
  { label: "All", value: "All" },
  { label: "Materials", value: "Materials" },
  { label: "Labour", value: "Wages" },
  { label: "Equipment", value: "Expense" },
  { label: "Income", value: "Income" },
];

function resolveProjectName(project) {
  if (!project) return "";
  if (typeof project === "string") return project;
  return project.projectName || project.name || "";
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  const h = dt.getHours(), m = String(dt.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

export default function TransactionLog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(() => searchParams.get("type") || "All");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [confirmDlg, setConfirmDlg] = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const fetchTransactions = useCallback(() => {
    setLoading(true); setError("");
    transactionAPI.getAll()
      .then(({ data }) => { setTransactions(data.transactions || []); setLoading(false); })
      .catch(err => { setError(err?.response?.data?.message || "Failed to load transactions."); setLoading(false); });
  }, []);

  useEffect(() => {
    fetchTransactions();
    window.addEventListener("focus", fetchTransactions);
    return () => window.removeEventListener("focus", fetchTransactions);
  }, [fetchTransactions]);

  const handleDelete = (id) => {
    const tx = transactions.find(t => t._id === id);
    setConfirmDlg({
      message: `Delete "${tx?.title || "this entry"}"?`, danger: true, confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirmDlg(null);
        try { await transactionAPI.delete(id); fetchTransactions(); setToast({ msg: "Deleted.", type: "success" }); }
        catch { setToast({ msg: "Delete failed.", type: "error" }); }
      },
    });
  };

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const desc = (t.title || "").toLowerCase();
    const proj = resolveProjectName(t.project).toLowerCase();
    const matchSearch = !q || desc.includes(q) || proj.includes(q);
    if (filter === "All") return matchSearch;
    return matchSearch && t.type === filter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const income = transactions.filter(t => t.type === "Income").reduce((s, t) => s + (t.amount || 0), 0);
  const expenses = transactions.filter(t => t.type !== "Income").reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", background: colors.bgBase4, fontFamily: typography.fontFamily }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && <ConfirmDialog message={confirmDlg.message} danger={confirmDlg.danger} confirmLabel={confirmDlg.confirmLabel} onConfirm={confirmDlg.onConfirm} onCancel={() => setConfirmDlg(null)} />}

      {/* Top Bar */}
      <div style={{ background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>Transaction Log</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textLight }}>All entries across projects</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.bgBase4, borderRadius: radius.sm, padding: "9px 14px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search entries..." style={{ border: "none", outline: "none", fontSize: 13, color: colors.textPrimary, background: "transparent", width: 180 }} />
          </div>
          <button onClick={fetchTransactions} style={{ padding: "9px 14px", borderRadius: radius.sm, border: `1px solid ${colors.cardBorder}`, background: colors.cardBg, color: colors.textSecondary, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Refresh
          </button>
          <button onClick={() => navigate("/manualentry")}
            style={{ padding: "9px 20px", borderRadius: radius.sm, border: "none", background: gradients.primaryButton, color: "#FFF", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Entry
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: "flex", gap: 12, padding: "16px 24px 0", flexWrap: "wrap" }}>
        <div style={{ background: colors.cardBg, borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`, padding: "12px 18px", flex: 1, minWidth: 160, boxShadow: shadows.card }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.textLight, letterSpacing: "0.06em", marginBottom: 4 }}>INCOME</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#15803D" }}>₹{income.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ background: colors.cardBg, borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`, padding: "12px 18px", flex: 1, minWidth: 160, boxShadow: shadows.card }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.textLight, letterSpacing: "0.06em", marginBottom: 4 }}>EXPENSES</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#DC2626" }}>₹{expenses.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ background: colors.cardBg, borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`, padding: "12px 18px", flex: 1, minWidth: 160, boxShadow: shadows.card }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: colors.textLight, letterSpacing: "0.06em", marginBottom: 4 }}>NET BALANCE</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: income - expenses >= 0 ? "#15803D" : "#DC2626" }}>₹{(income - expenses).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "16px 24px", flexShrink: 0, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            style={{
              padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
              fontWeight: filter === f.value ? 800 : 600, fontSize: 12,
              background: filter === f.value ? gradients.primaryButton : colors.cardBg,
              color: filter === f.value ? "#FFF" : colors.textSecondary,
              boxShadow: filter === f.value ? "none" : shadows.card,
              transition: "all 0.15s",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: radius.sm, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            {error}
            <button onClick={fetchTransactions} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 6, border: `1px solid #FCA5A5`, background: "transparent", color: "#DC2626", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${colors.bgBase4}`, borderTopColor: colors.primaryBlue, animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: colors.textLight }}>Loading...</div>
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: colors.textLight, fontSize: 13 }}>
            {transactions.length === 0 ? "No entries yet. Create your first entry to get started." : "No entries match your filters."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paginated.map((t, i) => {
              const st = TYPE_STYLES[t.type] || TYPE_STYLES.Expense;
              const pName = resolveProjectName(t.project) || "";
              const isPositive = t.type === "Income";
              return (
                <div key={t._id || i} style={{
                  display: "flex", gap: 14,
                  background: colors.cardBg, borderRadius: radius.lg,
                  border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
                  padding: "14px", cursor: "pointer",
                  borderLeft: `4px solid ${isPositive ? colors.success : colors.primaryBlue}`,
                }} onClick={() => navigate("/entry-detail", { state: { entry: t } })}>
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: st.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={st.color} strokeWidth="1.8"><path d={st.icon} /></svg>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{t.title || "Untitled"}</span>
                        {pName && <span style={{ fontSize: 12, color: colors.textLight, marginLeft: 8 }}>{pName}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: st.bg, color: st.color, letterSpacing: "0.04em",
                        }}>{(t.type === "Wages" ? "Labour" : t.type === "Expense" ? "Equipment" : t.type || "EXPENSE").toUpperCase()}</span>
                        <div onClick={e => { e.stopPropagation(); handleDelete(t._id); }}
                          style={{ color: colors.textLight, fontSize: 14, cursor: "pointer", padding: "2px" }}>
                          &times;
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: colors.textLight }}>
                        {t.date ? formatDate(t.date) : ""} {t.date ? formatTime(t.date) : ""}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: isPositive ? colors.success : colors.textPrimary }}>
                        {isPositive ? "+" : "-"}₹{(t.amount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, fontSize: 13, color: colors.textLight }}>
            <span>Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: "6px 12px", borderRadius: radius.sm, border: `1px solid ${colors.cardBorder}`, background: colors.cardBg, color: page <= 1 ? colors.textLight : colors.textPrimary, cursor: page <= 1 ? "default" : "pointer", fontWeight: 600, fontSize: 12 }}>Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i === 4 ? totalPages : i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = [1, "...", page, "...", totalPages][i];
                return typeof p === "number" ? (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: "6px 12px", borderRadius: radius.sm, border: "none", background: p === page ? colors.primaryBlue : colors.cardBg, color: p === page ? "#FFF" : colors.textPrimary, fontWeight: p === page ? 700 : 500, fontSize: 12, cursor: "pointer", minWidth: 32 }}>
                    {p}
                  </button>
                ) : <span key={`e${i}`} style={{ padding: "6px 4px", color: colors.textLight }}>{p}</span>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: "6px 12px", borderRadius: radius.sm, border: `1px solid ${colors.cardBorder}`, background: colors.cardBg, color: page >= totalPages ? colors.textLight : colors.textPrimary, cursor: page >= totalPages ? "default" : "pointer", fontWeight: 600, fontSize: 12 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
