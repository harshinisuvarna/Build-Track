import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";
import { Card, Badge, Button, EmptyState } from "../components/ui";
import { Search, Plus, RefreshCw, ArrowUpRight, ArrowDownRight, DollarSign, Trash2, Filter } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const TYPE_STYLES = {
  Materials: { bg: "#EEF0FF", color: "#5B5CEB", label: "Materials" },
  Wages:     { bg: "#F0FDF4", color: "#22C55E", label: "Labour" },
  Expense:   { bg: "#FFFBEB", color: "#F59E0B", label: "Equipment" },
  Income:    { bg: "#F3E8FF", color: "#8B5CF6", label: "Income" },
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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
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
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', animation: 'fadeUp 300ms ease' }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && <ConfirmDialog message={confirmDlg.message} danger={confirmDlg.danger} confirmLabel={confirmDlg.confirmLabel} onConfirm={confirmDlg.onConfirm} onCancel={() => setConfirmDlg(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', margin: 0, marginBottom: 4 }}>
            Transaction Log
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>All entries across projects</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="md" icon={<RefreshCw size={14} />} onClick={fetchTransactions}>
            Refresh
          </Button>
          <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={() => navigate("/manualentry")}>
            New Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Income', value: income, color: '#22C55E', icon: ArrowUpRight },
          { label: 'Expenses', value: expenses, color: '#EF4444', icon: ArrowDownRight },
          { label: 'Net Balance', value: income - expenses, color: income - expenses >= 0 ? '#22C55E' : '#EF4444', icon: DollarSign },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${item.color}10`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color={item.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color, letterSpacing: '-0.03em' }}>
                  ₹{Math.abs(item.value).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 12px', height: 36, gap: 8, minWidth: 200 }}>
          <Search size={14} color="#94A3B8" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search entries..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#111827', background: 'transparent', width: '100%', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontWeight: filter === f.value ? 600 : 500, fontSize: 12,
                background: filter === f.value ? '#5B5CEB' : '#F1F5F9',
                color: filter === f.value ? '#fff' : '#64748B',
                transition: 'all 150ms', fontFamily: 'inherit',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={fetchTransactions} style={{ background: 'transparent', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 12px', color: '#DC2626', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #F1F5F9', borderTopColor: '#5B5CEB', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: '#64748B' }}>Loading...</div>
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={22} />}
          title={transactions.length === 0 ? "No entries yet" : "No matches"}
          description={transactions.length === 0 ? 'Create your first entry to get started.' : 'No entries match your filters.'}
          actionLabel={transactions.length === 0 ? "Add Entry" : undefined}
          onAction={() => navigate("/manualentry")}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginated.map((t, i) => {
              const st = TYPE_STYLES[t.type] || TYPE_STYLES.Expense;
              const pName = resolveProjectName(t.project) || "";
              const isPositive = t.type === "Income";
              return (
                <div key={t._id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#fff', borderRadius: 10,
                  border: '1px solid #E5E7EB', padding: '14px 18px',
                  cursor: 'pointer', transition: 'box-shadow 150ms ease, background 150ms ease',
                }}
                  onClick={() => navigate("/entry-detail", { state: { entry: t } })}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#fff'; }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                    background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DollarSign size={16} color={st.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                        {t.title || "Untitled"}
                        {pName && <span style={{ fontSize: 12, color: '#64748B', fontWeight: 400, marginLeft: 8 }}>{pName}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge variant={t.type === 'Wages' ? 'success' : t.type === 'Expense' ? 'warning' : 'info'} size="sm">
                          {st.label}
                        </Badge>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}
                          style={{ color: '#94A3B8', cursor: 'pointer', display: 'flex', padding: 2, background: 'none', border: 'none' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>
                        {t.date ? `${formatDate(t.date)} ${formatTime(t.date)}` : ''}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isPositive ? '#22C55E' : '#111827' }}>
                        {isPositive ? '+' : '-'}₹{(t.amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filtered.length > ITEMS_PER_PAGE && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 13, color: '#64748B' }}>
              <span>Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: page <= 1 ? '#94A3B8' : '#111827', cursor: page <= 1 ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i === 4 ? totalPages : i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = [1, "...", page, "...", totalPages][i];
                  return typeof p === "number" ? (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: p === page ? '#5B5CEB' : '#fff', color: p === page ? '#fff' : '#111827', fontWeight: p === page ? 600 : 500, fontSize: 12, cursor: 'pointer', minWidth: 32, fontFamily: 'inherit' }}>
                      {p}
                    </button>
                  ) : <span key={`e${i}`} style={{ padding: '6px 4px', color: '#94A3B8' }}>{p}</span>;
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: page >= totalPages ? '#94A3B8' : '#111827', cursor: page >= totalPages ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
