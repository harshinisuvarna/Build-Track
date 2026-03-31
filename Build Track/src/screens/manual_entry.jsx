// src/screens/manual_entry.jsx
// ✅ CONNECTED TO BACKEND:
//   • GET  /api/workers         → populates Worker dropdown with real names
//   • GET  /api/projects        → populates Project dropdown with real names
//   • POST /api/transactions    → saves new entry as JSON
//   • GET  /api/transactions    → loads and displays recent entries list
//   • DELETE /api/transactions/:id → removes an entry

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { workerAPI, projectAPI, transactionAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";

const transactionTypes = ["Wages", "Expense", "Income", "Materials"];

const TYPE_STYLE = {
  Wages:     { bg: "#ecfdf5", color: "#166534", dot: "#22c55e" },
  Expense:   { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  Income:    { bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6" },
  Materials: { bg: "#fff7ed", color: "#9a3412", dot: "#f97316" },
};

export default function ManualEntryPage() {
  const navigate = useNavigate();

  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  // ── Dropdown data loaded from backend ─────────────────────────────────────
  const [workerOptions,  setWorkerOptions]  = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [txType,  setTxType]  = useState("");
  const [date,    setDate]    = useState(() => new Date().toISOString().split("T")[0]);
  const [worker,  setWorker]  = useState("");
  const [project, setProject] = useState("");
  const [title,   setTitle]   = useState("");
  const [amount,  setAmount]  = useState("");
  const [notes,   setNotes]   = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving,      setSaving]      = useState(false);
  const [errMsg,      setErrMsg]      = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  // ── Transactions list ─────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [txLoading,    setTxLoading]    = useState(true);
  const [toast,        setToast]        = useState({ msg: "", type: "info" });
  const [confirmDlg,   setConfirmDlg]   = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);
  const workerLabel = useCallback((w) => w?.name || "Unknown worker", []);
  const projectLabel = useCallback((p) => p?.projectName || "Unknown project", []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Load workers + projects for dropdowns ─────────────────────────────────
  useEffect(() => {
    workerAPI.getAll()
      .then(({ data }) => setWorkerOptions(data.workers || []))
      .catch(err => console.warn("Could not load workers:", err));

    projectAPI.getAll()
      .then(({ data }) => setProjectOptions(data.projects || []))
      .catch(err => console.warn("Could not load projects:", err));
  }, []);

  // ── Load existing transactions ─────────────────────────────────────────────
  const fetchTransactions = () => {
    setTxLoading(true);
    transactionAPI.getAll()
      .then(({ data }) => setTransactions(data.transactions || []))
      .catch(err => console.error("Could not load transactions:", err))
      .finally(() => setTxLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  // ── Submit form ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setErrMsg("");
    setSuccessMsg("");

    if (!txType)         { setErrMsg("Please select a transaction type."); return; }
    if (!title.trim())   { setErrMsg("Please enter a title/description."); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrMsg("Please enter a valid amount."); return;
    }

    try {
      setSaving(true);
      await transactionAPI.create({
        title:   title.trim(),
        amount:  Number(amount),
        type:    txType,
        worker:  worker  || null,
        project: project || null,
        date:    date    || new Date().toISOString(),
        notes:   notes.trim(),
      });
      setSuccessMsg("Entry saved successfully!");
      // Reset form
      setTxType(""); setTitle(""); setAmount(""); setNotes("");
      setWorker(""); setProject("");
      setDate(new Date().toISOString().split("T")[0]);
      // Refresh list
      fetchTransactions();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrMsg(err.response?.data?.message || "Failed to save entry. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete transaction ────────────────────────────────────────────────────
  const handleDelete = (id) => {
    const tx = transactions.find(t => t._id === id);
    setConfirmDlg({
      message: `Delete "${tx?.title || 'this entry'}"?`,
      danger: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await transactionAPI.delete(id);
          setTransactions(prev => prev.filter(t => t._id !== id));
          setToast({ msg: "Entry deleted.", type: "success" });
        } catch (err) {
          setToast({ msg: err.response?.data?.message || "Failed to delete entry.", type: "error" });
        }
      },
    });
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const selectStyle = {
    width: "100%", padding: "11px 14px",
    background: "#f9f9f9", border: "1px solid #e5e5e5",
    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
    fontWeight: 500, outline: "none",
    appearance: "none", cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  };
  const inputStyle = {
    ...selectStyle, appearance: "unset",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#555",
    letterSpacing: "0.04em", marginBottom: 8,
    display: "flex", alignItems: "center", gap: 6,
  };

  return (
    <div style={{
      display: "flex", width: "100%", height: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8", overflow: "hidden", flex: 1, minWidth: 0,
    }}>
      {/* Toast + Confirm Dialog */}
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* ── Top Bar ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Manual Entry</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Log a transaction manually</p>
          </div>
          <button
            onClick={() => navigate("/voice")}
            style={{
              padding: "9px 18px", background: "#fff", color: "#555",
              border: "1px solid #e5e5e5", borderRadius: 10,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
            }}
          >
            ← Back to Voice Assistant
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>

            {/* Alerts */}
            {errMsg && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
                ⚠️ {errMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", color: "#166534", fontSize: 13, marginBottom: 16 }}>
                ✅ {successMsg}
              </div>
            )}

            {/* ── Form Card ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px 32px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 20 }}>

              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Log Transaction Details</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Please provide precise information for financial tracking.</p>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 20 }}>
                <div style={labelStyle}>📋 Title / Description *</div>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cement purchase, Daily wages"
                  style={inputStyle}
                />
              </div>

              {/* Row 1: Transaction Type + Date */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={labelStyle}>👤 Transaction Type *</div>
                  <div style={{ position: "relative" }}>
                    <select value={txType} onChange={e => setTxType(e.target.value)} style={selectStyle}>
                      <option value="">Select entry type</option>
                      {transactionTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>📅 Date</div>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ ...selectStyle, color: date ? "#1a1a1a" : "#aaa" }} />
                </div>
              </div>

              {/* Row 2: Worker + Project */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={labelStyle}>👷 Worker Name <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                  <div style={{ position: "relative" }}>
                    <select value={worker} onChange={e => setWorker(e.target.value)} style={selectStyle}>
                      <option value="">Select worker (optional)</option>
                      {workerOptions.map(w => (
                        <option key={w._id} value={w._id}>{workerLabel(w)}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>🏗️ Project <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                  <div style={{ position: "relative" }}>
                    <select value={project} onChange={e => setProject(e.target.value)} style={selectStyle}>
                      <option value="">Select project (optional)</option>
                      {projectOptions.map(p => (
                        <option key={p._id} value={p._id}>{projectLabel(p)}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Amount */}
              <div style={{ marginBottom: 20 }}>
                <div style={labelStyle}>💰 Amount *</div>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 8 }}>
                  <span style={{ fontSize: 15, color: "#ea580c", fontWeight: 600 }}>₹</span>
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00" min="0"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500, fontFamily: "'Segoe UI', sans-serif" }}
                  />
                </div>
              </div>

              {/* Row 4: Notes */}
              <div style={{ marginBottom: 28 }}>
                <div style={labelStyle}>📝 Description / Notes</div>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Enter specific details about this transaction..."
                  rows={4}
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "#f9f9f9", border: "1px solid #e5e5e5",
                    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
                    fontFamily: "'Segoe UI', sans-serif", outline: "none",
                    resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "14px 0", background: saving ? "#f59561" : "#ea580c", color: "#fff",
                    border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15,
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 14px rgba(234,88,12,0.3)",
                    transition: "background 0.2s",
                  }}
                >
                  {saving ? "⏳ Saving…" : "💾 Save Entry"}
                </button>
                <button
                  onClick={() => { setTxType(""); setTitle(""); setAmount(""); setNotes(""); setWorker(""); setProject(""); }}
                  style={{
                    padding: "14px 0", background: "#fff", color: "#555",
                    border: "1px solid #e5e5e5", borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* ── Tip Banner ── */}
            <div style={{ background: "#fff9f5", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff5f0", border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💡</div>
              <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                <strong style={{ color: "#ea580c" }}>Tip:</strong>{" "}
                Use{" "}
                <span onClick={() => navigate("/voice")} style={{ color: "#ea580c", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
                  Voice Assistant
                </span>{" "}
                for even faster entry logging. Just say &quot;Paid worker Amit ₹500 for cement work&quot;.
              </p>
            </div>

            {/* ── Recent Entries List ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "22px 28px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
                Recent Entries
              </h3>

              {txLoading && (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#aaa", fontSize: 14 }}>Loading entries…</div>
              )}

              {!txLoading && transactions.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#aaa", fontSize: 14 }}>
                  No entries yet. Add your first transaction above.
                </div>
              )}

              {!txLoading && transactions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {transactions.slice(0, 20).map(tx => {
                    const st = TYPE_STYLE[tx.type] || TYPE_STYLE["Expense"];
                    return (
                      <div key={tx._id} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px", borderRadius: 12,
                        border: "1px solid #f0f0f0", background: "#fafafa",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}
                      >
                        {/* Type dot */}
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: st.dot, flexShrink: 0,
                        }} />

                        {/* Title + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tx.title}
                          </div>
                          <div style={{ fontSize: 12, color: "#999", display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ padding: "1px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{tx.type}</span>
                            {tx.worker  && <span>👷 {workerLabel(tx.worker)}</span>}
                            {tx.project && <span>🏗️ {projectLabel(tx.project)}</span>}
                            <span>📅 {new Date(tx.date).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div style={{ fontWeight: 700, fontSize: 15, color: tx.type === "Income" ? "#166534" : "#1a1a1a", flexShrink: 0 }}>
                          {tx.type === "Income" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(tx._id)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: "1px solid #fee2e2", background: "#fff5f5",
                            cursor: "pointer", fontSize: 13, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          title="Delete entry"
                        >🗑️</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}