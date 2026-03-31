import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";

const ITEMS_PER_PAGE = 10;

const categoryStyle = {
  Wages:     { bg: "#fce7f3", color: "#9d174d" },
  Expense:   { bg: "#fef3c7", color: "#92400e" },
  Income:    { bg: "#dcfce7", color: "#166534" },
  Materials: { bg: "#e0e7ff", color: "#3730a3" },
};

// ✅ Safely resolve project name from either a populated object or a plain string
const resolveProjectName = (project) => {
  if (!project) return "";
  if (typeof project === "string") return project;
  if (typeof project === "object") return project.projectName || project.name || project.title || "";
  return "";
};

export default function TransactionLog() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [filter, setFilter]             = useState("All");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);
  const [toast, setToast]               = useState({ msg: "", type: "info" });
  const [confirmDlg, setConfirmDlg]     = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  // ✅ Wrapped in useCallback so it's stable as a dependency in useEffect
  const fetchTransactions = useCallback(() => {
    setLoading(true);
    setError("");
    transactionAPI
      .getAll()
      .then(({ data }) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Tx load error:", err);
        setError(
          err?.response?.data?.message ||
          "Failed to load transactions. Please try again."
        );
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Initial load
    fetchTransactions();

    // ✅ FIX: Re-fetch when user navigates back to this tab/window.
    // This ensures auto-created project transactions appear without
    // the user having to manually reload the page.
    const onFocus = () => fetchTransactions();
    window.addEventListener("focus", onFocus);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("resize", onResize);
    };
  }, [fetchTransactions]);

  const handleDelete = (id) => {
    const tx = transactions.find((t) => t._id === id);
    setConfirmDlg({
      message: `Delete transaction "${tx?.title || "this entry"}"?`,
      danger: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await transactionAPI.delete(id);
          fetchTransactions();
          setToast({ msg: "Transaction deleted.", type: "success" });
        } catch {
          setToast({ msg: "Failed to delete transaction.", type: "error" });
        }
      },
    });
  };

  const filtered = transactions.filter((t) => {
    const desc = t.title || "";
    const proj = resolveProjectName(t.project);
    const matchSearch =
      desc.toLowerCase().includes(search.toLowerCase()) ||
      proj.toLowerCase().includes(search.toLowerCase());
    if (filter !== "All") return matchSearch && t.type === filter;
    return matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const monthlyIncome   = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + (t.amount ?? 0), 0);
  const monthlyExpenses = transactions.filter((t) => t.type !== "Income").reduce((s, t) => s + (t.amount ?? 0), 0);
  const netBalance      = monthlyIncome - monthlyExpenses;

  const fmt = (n) => "₹ " + Math.abs(n).toLocaleString("en-IN");

  const exportCSV = () => {
    const rows = filtered.map((t) => {
      const projName = resolveProjectName(t.project);
      return `${new Date(t.date).toLocaleDateString("en-IN")},"${(t.title || "").replace(/"/g, '""')}",${t.type},"${projName}",${t.amount ?? 0}`;
    });
    const csv  = ["Date,Description,Transaction Type,Project,Amount", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = "transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)               return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2)  return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page, "...", totalPages];
  };

  const paginationLabel = () => {
    if (filtered.length === 0) return "Showing 0 entries";
    const from = (page - 1) * ITEMS_PER_PAGE + 1;
    const to   = Math.min(page * ITEMS_PER_PAGE, filtered.length);
    return (
      <>
        Showing <strong>{from}</strong>–<strong>{to}</strong> of{" "}
        <strong>{filtered.length}</strong> entries
      </>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        background: "#f7f7f8",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && (
        <ConfirmDialog
          message={confirmDlg.message}
          danger={confirmDlg.danger}
          confirmLabel={confirmDlg.confirmLabel}
          onConfirm={confirmDlg.onConfirm}
          onCancel={() => setConfirmDlg(null)}
        />
      )}

      {/* ── Top Bar ── */}
      <div
        style={{
          flexShrink: 0,
          background: "#fff",
          borderBottom: "1px solid #ebebeb",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
            Transaction Log
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
            Manage and track all construction-related financial entries.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* ✅ Manual refresh button */}
          <button
            onClick={fetchTransactions}
            style={{
              padding: "10px 16px",
              background: "#f5f5f5",
              color: "#555",
              border: "1px solid #e5e5e5",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => navigate("/manualentry")}
            style={{
              padding: "10px 20px",
              background: "#ea580c",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            + Manual Entry
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Error banner */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span style={{ color: "#dc2626", fontSize: 14, fontWeight: 500 }}>
              ⚠️ {error}
            </span>
            <button
              onClick={fetchTransactions}
              style={{
                padding: "6px 14px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter + Search Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {["All", "Wages", "Expense", "Income", "Materials"].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                style={{
                  padding: "7px 16px",
                  borderRadius: 20,
                  border: "1.5px solid",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background:  filter === f ? "#ea580c" : "#fff",
                  color:       filter === f ? "#fff"    : "#555",
                  borderColor: filter === f ? "#ea580c" : "#e5e5e5",
                }}
              >
                {f}
              </button>
            ))}
            <button
              onClick={exportCSV}
              style={{
                padding: "7px 16px",
                background: "#f5f5f5",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                color: "#555",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⬇ Export
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 10,
              padding: "9px 14px",
              gap: 8,
            }}
          >
            <span style={{ color: "#aaa" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search worker, project..."
              style={{
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#555",
                background: "transparent",
                width: isMobile ? 130 : 200,
              }}
            />
          </div>
        </div>

        {/* ── Table Card ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #ebebeb",
            overflowX: "auto",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          {/* Desktop Table */}
          {!isMobile && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {["DATE", "DESCRIPTION", "TRANSACTION TYPE", "PROJECT", "AMOUNT (₹)", ""].map(
                    (col, i) => (
                      <th
                        key={col + i}
                        style={{
                          padding: "13px 20px",
                          textAlign: i >= 4 ? "right" : "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#aaa",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                      Loading…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                      No entries found
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => (
                    <tr
                      key={t._id}
                      style={{ borderBottom: "1px solid #f9f9f9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#1a1a1a", fontWeight: 500 }}>
                        {t.title}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: categoryStyle[t.type]?.bg || "#f5f5f5",
                            color:      categoryStyle[t.type]?.color || "#555",
                          }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#555" }}>
                        {resolveProjectName(t.project) || "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "right",
                          fontSize: 14,
                          fontWeight: 700,
                          color: t.type === "Income" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {t.type === "Income" ? "+" : "-"}
                        {(t.amount ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDelete(t._id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {loading ? (
                <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 14 }}>Loading…</div>
              ) : paginated.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 14 }}>No entries found</div>
              ) : (
                paginated.map((t) => (
                  <div key={t._id} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginBottom: 2 }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>
                          {new Date(t.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: t.type === "Income" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {t.type === "Income" ? "+" : "-"}
                        {(t.amount ?? 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: categoryStyle[t.type]?.bg || "#f5f5f5",
                          color:      categoryStyle[t.type]?.color || "#555",
                        }}
                      >
                        {t.type}
                      </span>
                      <button
                        onClick={() => handleDelete(t._id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }}
                      >
                        Delete
                      </button>
                      <span style={{ fontSize: 12, color: "#666" }}>
                        {resolveProjectName(t.project) || "N/A"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#888" }}>{paginationLabel()}</span>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid #e5e5e5", background: "#fff",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  color: page === 1 ? "#ccc" : "#555", fontSize: 16,
                }}
              >
                ‹
              </button>
              {getPages().map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === "number" && setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "1px solid",
                    fontSize: 13,
                    cursor: typeof p === "number" ? "pointer" : "default",
                    fontWeight: 600,
                    borderColor: page === p ? "#ea580c" : "#e5e5e5",
                    background:  page === p ? "#ea580c" : "#fff",
                    color:       page === p ? "#fff"    : "#555",
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid #e5e5e5", background: "#fff",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  color: page === totalPages ? "#ccc" : "#555", fontSize: 16,
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            paddingBottom: 24,
          }}
        >
          <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "18px 22px", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.08em", marginBottom: 8 }}>
              MONTHLY INCOME
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#15803d" }}>{fmt(monthlyIncome)}</div>
          </div>
          <div style={{ background: "#fff7f0", borderRadius: 14, padding: "18px 22px", border: "1px solid #fed7aa" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", letterSpacing: "0.08em", marginBottom: 8 }}>
              MONTHLY EXPENSES
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#c2410c" }}>{fmt(monthlyExpenses)}</div>
          </div>
          <div style={{ background: "#fff5f0", borderRadius: 14, padding: "18px 22px", border: "1.5px solid #ea580c" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", letterSpacing: "0.08em", marginBottom: 8 }}>
              NET BALANCE
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: netBalance >= 0 ? "#15803d" : "#dc2626" }}>
              {netBalance < 0 ? "-" : "+"}{fmt(netBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}