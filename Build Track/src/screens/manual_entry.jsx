import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { workerAPI, projectAPI, transactionAPI } from "../api";
// transactionAPI.update is used by the edit modal below
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


  const [workerOptions,  setWorkerOptions]  = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);

  const [txType,    setTxType]    = useState("");
  const [date,      setDate]      = useState(() => new Date().toISOString().split("T")[0]);
  const [worker,    setWorker]    = useState("");
  const [project,   setProject]   = useState("");
  const [title,     setTitle]     = useState("");
  const [amount,    setAmount]    = useState("");
  const [notes,     setNotes]     = useState("");

  const [quantity,  setQuantity]  = useState("");
  const [unit,      setUnit]      = useState("");
  const [rate,      setRate]      = useState("");
  const [materialType, setMaterialType] = useState("purchase");

  // ── New optional fields ──
  const [brand,         setBrand]         = useState("");
  const [unitType,      setUnitType]      = useState("");
  const [rateType,      setRateType]      = useState("");
  const [workDone,      setWorkDone]      = useState("");
  const [usage,         setUsage]         = useState("");
  const [machineType,   setMachineType]   = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMode,   setPaymentMode]   = useState("");
  const [paymentDate,   setPaymentDate]   = useState("");
  const [remarks,       setRemarks]       = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotDragOver, setScreenshotDragOver] = useState(false);

  const [saving,      setSaving]      = useState(false);
  const [errMsg,      setErrMsg]      = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  // ── Edit modal state ──
  const [editTx,        setEditTx]        = useState(null);   // the tx being edited
  const [editSaving,    setEditSaving]    = useState(false);
  const [editErr,       setEditErr]       = useState("");

  const [transactions, setTransactions] = useState([]);
  const [txLoading,    setTxLoading]    = useState(true);
  const [toast,        setToast]        = useState({ msg: "", type: "info" });
  const [confirmDlg,   setConfirmDlg]   = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);
  const workerLabel  = useCallback((w) => w?.name        || "Unknown worker",  []);
  const projectLabel = useCallback((p) => p?.projectName || "Unknown project", []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    workerAPI.getAll()
      .then(({ data }) => setWorkerOptions(data.workers || []))
      .catch(() => {});

    projectAPI.getAll()
      .then(({ data }) => setProjectOptions(data.projects || []))
      .catch(() => {});
  }, []);

  const fetchTransactions = () => {
    setTxLoading(true);
    transactionAPI.getAll()
      .then(({ data }) => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setTxLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  useEffect(() => {
    if (txType === "Materials") {
      const q = parseFloat(quantity) || 0;
      const r = parseFloat(rate)     || 0;
      if (q > 0 && r > 0) setAmount(String(q * r));
    } else if (txType === "Wages") {
      const wd = parseFloat(workDone) || 0;
      const r  = parseFloat(rate)     || 0;
      if (wd > 0 && r > 0) setAmount(String(wd * r));
    } else if (txType === "Expense") {
      const u = parseFloat(usage) || 0;
      const r = parseFloat(rate)  || 0;
      if (u > 0 && r > 0) setAmount(String(u * r));
    }
  }, [quantity, rate, workDone, usage, txType]);

  const handleSave = async () => {
    setErrMsg("");
    setSuccessMsg("");

    if (!txType)       { setErrMsg("Please select a transaction type."); return; }
    if (!title.trim()) { setErrMsg("Please enter a title/description."); return; }

    if (txType === "Materials") {
      if (!quantity || parseFloat(quantity) <= 0) { setErrMsg("Please enter a valid quantity."); return; }
      if (!rate     || parseFloat(rate)     <= 0) { setErrMsg("Please enter a valid rate.");     return; }
    } else {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setErrMsg("Please enter a valid amount."); return;
      }
    }

    try {
      setSaving(true);

      // Build FormData so any file is sent as multipart/form-data
      const fd = new FormData();
      fd.append("title",   title.trim());
      fd.append("amount",  Number(amount));
      fd.append("type",    txType);
      fd.append("date",    date || new Date().toISOString());
      fd.append("notes",   notes.trim());
      if (worker)  fd.append("worker",  worker);
      if (project) fd.append("project", project);

      // For Materials send category = title (backend fallback also handles this)
      if (txType === "Materials") {
        fd.append("category", title.trim());
        fd.append("quantity", parseFloat(quantity) || 0);
        fd.append("unit",     unit.trim() || "unit");
        fd.append("rate",     parseFloat(rate) || 0);
        fd.append("materialType", materialType);
      }

      // Optional fields
      if (brand)         fd.append("brand",         brand);
      if (unitType)      fd.append("unitType",      unitType);
      if (parseFloat(workDone) > 0) fd.append("workDone", parseFloat(workDone));
      if (parseFloat(usage)    > 0) fd.append("usage",    parseFloat(usage));
      if (machineType)   fd.append("machineType",   machineType);
      if (rateType)      fd.append("rateType",      rateType);
      if (paymentStatus) fd.append("paymentStatus", paymentStatus);
      if (paymentMode)   fd.append("paymentMode",   paymentMode);
      if (paymentDate)   fd.append("paymentDate",   paymentDate);
      if (remarks)       fd.append("remarks",       remarks);
      if (paymentScreenshot) fd.append("paymentScreenshot", paymentScreenshot);

      console.log("[ManualEntry] Submitting FormData for type:", txType);
      await transactionAPI.create(fd);
      console.log("[ManualEntry] Transaction saved successfully.");
      setSuccessMsg("Entry saved successfully!");

      setTxType(""); setTitle(""); setAmount(""); setNotes("");
      setWorker(""); setProject("");
      setDate(new Date().toISOString().split("T")[0]);
      setQuantity(""); setUnit(""); setRate("");
      setMaterialType("purchase");
      setBrand(""); setUnitType(""); setRateType(""); setWorkDone("");
      setUsage(""); setMachineType(""); setPaymentStatus("");
      setPaymentMode(""); setPaymentDate(""); setRemarks("");
      setPaymentScreenshot(null);

      fetchTransactions();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || err.friendlyMessage || err.message || "Failed to save entry. Try again.";
      console.error("[ManualEntry] Save failed:", status, message, err);
      setErrMsg(status ? `Error ${status}: ${message}` : message);
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (tx) => {
    setEditTx({
      _id:           tx._id,
      title:         tx.title         || "",
      type:          tx.type          || "",
      date:          tx.date ? new Date(tx.date).toISOString().split("T")[0] : "",
      amount:        tx.amount        || "",
      quantity:      tx.quantity      || "",
      rate:          tx.rate          || "",
      unit:          tx.unit          || "",
      notes:         tx.notes         || "",
      paymentStatus: tx.paymentStatus || "",
      paymentMode:   tx.paymentMode   || "",
      remarks:       tx.remarks       || "",
    });
    setEditErr("");
  };
  const handleEditSave = async () => {
    if (!editTx.title.trim()) { setEditErr("Title is required."); return; }
    if (!editTx.amount || Number(editTx.amount) < 0) { setEditErr("Valid amount is required."); return; }
    try {
      setEditSaving(true);
      setEditErr("");
      const payload = {
        title:         editTx.title.trim(),
        date:          editTx.date,
        notes:         editTx.notes,
        paymentStatus: editTx.paymentStatus,
        paymentMode:   editTx.paymentMode,
        remarks:       editTx.remarks,
        ...(editTx.quantity && { quantity: Number(editTx.quantity) }),
        ...(editTx.rate     && { rate:     Number(editTx.rate) }),
      };
      if (!editTx.quantity || !editTx.rate) payload.amount = Number(editTx.amount);
      await transactionAPI.update(editTx._id, payload);
      setToast({ msg: "Transaction updated!", type: "success" });
      setEditTx(null);
      fetchTransactions();
    } catch (err) {
      setEditErr(err.response?.data?.message || "Failed to update. Try again.");
    } finally {
      setEditSaving(false);
    }
  };
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
  const selectStyle = {
    width: "100%", padding: "11px 14px",
    background: "#f9f9f9", border: "1px solid #e5e5e5",
    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
    fontWeight: 500, outline: "none",
    appearance: "none", cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  };
  const inputStyle = { ...selectStyle, appearance: "unset" };
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
                    <select value={txType} onChange={e => {
                      setTxType(e.target.value);
                      setQuantity(""); setUnit(""); setRate("");
                      setWorkDone(""); setUsage(""); setMachineType(""); setRateType("");
                    }} style={selectStyle}>
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

              {txType === "Materials" && (
                <div style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 12,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#9a3412", letterSpacing: "0.04em", marginBottom: 14 }}>
                    🧱 MATERIALS DETAILS
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    {/* Brand */}
                    <div>
                      <div style={labelStyle}>🏷️ Brand <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <input
                        type="text"
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                        placeholder="e.g. Ultratech, Tata"
                        style={inputStyle}
                      />
                    </div>
                    {/* Unit Type */}
                    <div>
                      <div style={labelStyle}>↕️ Material Action *</div>
                      <div style={{ position: "relative", marginBottom: 12 }}>
                        <select value={materialType} onChange={e => setMaterialType(e.target.value)} style={selectStyle}>
                          <option value="purchase">Purchase (Add Stock)</option>
                          <option value="usage">Usage (Reduce Stock)</option>
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>📐 Unit Type <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <div style={{ position: "relative" }}>
                        <select value={unitType} onChange={e => setUnitType(e.target.value)} style={selectStyle}>
                          <option value="">Select unit</option>
                          <option value="kg">kg</option>
                          <option value="bag">bag</option>
                          <option value="ton">ton</option>
                          <option value="MT">MT</option>
                          <option value="sqft">sqft</option>
                          <option value="truck">truck</option>
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
                    {/* Quantity */}
                    <div>
                      <div style={labelStyle}>📦 Quantity *</div>
                      <input
                        type="number" min="0"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder="e.g. 50"
                        style={inputStyle}
                      />
                    </div>
                    {/* Unit */}
                    <div>
                      <div style={labelStyle}>📐 Unit</div>
                      <input
                        type="text"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        placeholder="bag, MT, truck, sqft…"
                        style={inputStyle}
                      />
                    </div>
                    {/* Rate */}
                    <div>
                      <div style={labelStyle}>💵 Rate per unit *</div>
                      <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 600 }}>₹</span>
                        <input
                          type="number" min="0"
                          value={rate}
                          onChange={e => setRate(e.target.value)}
                          placeholder="0.00"
                          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500, fontFamily: "'Segoe UI', sans-serif" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Auto-calculated total preview */}
                  {quantity && rate && parseFloat(quantity) > 0 && parseFloat(rate) > 0 && (
                    <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff", borderRadius: 8, border: "1px solid #fde4d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#9a3412" }}>
                        {materialType === "usage" ? "Use" : "Buy"} {quantity} {unit || unitType || "units"} × ₹{parseFloat(rate).toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#ea580c" }}>
                        = ₹{(parseFloat(quantity) * parseFloat(rate)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Wages Fields ── */}
              {txType === "Wages" && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 12,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", letterSpacing: "0.04em", marginBottom: 14 }}>
                    👷 WAGES DETAILS
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={labelStyle}>📏 Rate Type <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <div style={{ position: "relative" }}>
                        <select value={rateType} onChange={e => setRateType(e.target.value)} style={selectStyle}>
                          <option value="">Select rate type</option>
                          <option value="day">Per Day</option>
                          <option value="sqft">Per Sqft</option>
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>💵 Rate <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>₹</span>
                        <input
                          type="number" min="0"
                          value={rate}
                          onChange={e => setRate(e.target.value)}
                          placeholder="0.00"
                          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500, fontFamily: "'Segoe UI', sans-serif" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>🔢 Work Done <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(days / sqft)</span></div>
                      <input
                        type="number" min="0"
                        value={workDone}
                        onChange={e => setWorkDone(e.target.value)}
                        placeholder="e.g. 5"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  {workDone && rate && parseFloat(workDone) > 0 && parseFloat(rate) > 0 && (
                    <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff", borderRadius: 8, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#166534" }}>
                        {workDone} {rateType || "units"} × ₹{parseFloat(rate).toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>
                        = ₹{(parseFloat(workDone) * parseFloat(rate)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Equipment / Expense Fields ── */}
              {txType === "Expense" && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", letterSpacing: "0.04em", marginBottom: 14 }}>
                    🚜 EQUIPMENT / EXPENSE DETAILS
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={labelStyle}>⚙️ Machine Type <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <input
                        type="text"
                        value={machineType}
                        onChange={e => setMachineType(e.target.value)}
                        placeholder="e.g. JCB, Mixer"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <div style={labelStyle}>📏 Rate Type <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <div style={{ position: "relative" }}>
                        <select value={rateType} onChange={e => setRateType(e.target.value)} style={selectStyle}>
                          <option value="">Select rate type</option>
                          <option value="hour">Per Hour</option>
                          <option value="day">Per Day</option>
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>💵 Rate <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span></div>
                      <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>₹</span>
                        <input
                          type="number" min="0"
                          value={rate}
                          onChange={e => setRate(e.target.value)}
                          placeholder="0.00"
                          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500, fontFamily: "'Segoe UI', sans-serif" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>🔢 Usage <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(hrs / days)</span></div>
                      <input
                        type="number" min="0"
                        value={usage}
                        onChange={e => setUsage(e.target.value)}
                        placeholder="e.g. 8"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  {usage && rate && parseFloat(usage) > 0 && parseFloat(rate) > 0 && (
                    <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff", borderRadius: 8, border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#991b1b" }}>
                        {usage} {rateType || "units"} × ₹{parseFloat(rate).toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>
                        = ₹{(parseFloat(usage) * parseFloat(rate)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Amount */}
              <div style={{ marginBottom: 20 }}>
                <div style={labelStyle}>
                  💰 Amount *
                  {txType === "Materials" && (
                    <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(auto-calculated from qty × rate)</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 8 }}>
                  <span style={{ fontSize: 15, color: "#ea580c", fontWeight: 600 }}>₹</span>
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00" min="0"
                    readOnly={txType === "Materials"}
                    style={{
                      flex: 1, border: "none", background: "transparent", outline: "none",
                      fontSize: 14, color: txType === "Materials" ? "#888" : "#1a1a1a",
                      fontWeight: 500, fontFamily: "'Segoe UI', sans-serif",
                      cursor: txType === "Materials" ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Notes */}
              <div style={{ marginBottom: 20 }}>
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

              {/* ── Payment Fields (all types) ── */}
              <div style={{
                background: "#f8faff",
                border: "1px solid #e0e7ff",
                borderRadius: 12,
                padding: "18px 20px",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3730a3", letterSpacing: "0.04em", marginBottom: 14 }}>
                  💳 PAYMENT DETAILS <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {/* Payment Status */}
                  <div>
                    <div style={labelStyle}>✅ Payment Status</div>
                    <div style={{ position: "relative" }}>
                      <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={selectStyle}>
                        <option value="">Select status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Advance">Advance</option>
                      </select>
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                    </div>
                  </div>
                  {/* Payment Mode */}
                  <div>
                    <div style={labelStyle}>🏦 Payment Mode</div>
                    <div style={{ position: "relative" }}>
                      <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={selectStyle}>
                        <option value="">Select mode</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                    </div>
                  </div>
                  {/* Payment Date */}
                  <div>
                    <div style={labelStyle}>📅 Payment Date</div>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      style={{ ...selectStyle, color: paymentDate ? "#1a1a1a" : "#aaa" }}
                    />
                  </div>
                </div>
                {/* Remarks */}
                <div style={{ marginBottom: 16 }}>
                  <div style={labelStyle}>💬 Remarks</div>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Additional payment notes or instructions..."
                    rows={2}
                    style={{
                      width: "100%", padding: "11px 14px",
                      background: "#f9f9f9", border: "1px solid #e5e5e5",
                      borderRadius: 10, fontSize: 14, color: "#1a1a1a",
                      fontFamily: "'Segoe UI', sans-serif", outline: "none",
                      resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
                    }}
                  />
                </div>
                {/* Payment Screenshot — drag-drop upload box */}
                <div>
                  <div style={labelStyle}>📎 Payment Screenshot <span style={{ fontWeight: 400, color: "#aaa", fontSize: 11 }}>(optional · JPG, PNG, PDF · max 5 MB)</span></div>

                  {/* Hidden real input */}
                  <input
                    id="screenshot-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    style={{ display: "none" }}
                    onChange={e => setPaymentScreenshot(e.target.files[0] || null)}
                  />

                  {/* Drop zone */}
                  <div
                    onClick={() => document.getElementById("screenshot-input").click()}
                    onDragOver={e => { e.preventDefault(); setScreenshotDragOver(true); }}
                    onDragLeave={() => setScreenshotDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setScreenshotDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) setPaymentScreenshot(file);
                    }}
                    style={{
                      border: `2px dashed ${screenshotDragOver ? "#ea580c" : "#d1d5db"}`,
                      borderRadius: 12,
                      padding: "28px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: screenshotDragOver ? "#fff7ed" : "#fafafa",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "#f3f4f6", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px", fontSize: 22,
                    }}>📎</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>
                      Click to upload or drag and drop
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                      PNG, JPG, PDF up to 5MB
                    </div>
                  </div>

                  {/* Selected file preview */}
                  {paymentScreenshot && (
                    <div style={{
                      marginTop: 10, display: "flex", alignItems: "center",
                      gap: 8, padding: "8px 12px",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      borderRadius: 8, fontSize: 13,
                    }}>
                      <span style={{ fontSize: 16 }}>✅</span>
                      <span style={{ flex: 1, color: "#166534", fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {paymentScreenshot.name}
                      </span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        ({(paymentScreenshot.size / 1024).toFixed(0)} KB)
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); setPaymentScreenshot(null); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 16, color: "#ef4444", lineHeight: 1,
                        }}
                        title="Remove"
                      >✕</button>
                    </div>
                  )}
                </div>
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
                  onClick={() => {
                    setTxType(""); setTitle(""); setAmount(""); setNotes("");
                    setWorker(""); setProject("");
                    setQuantity(""); setUnit(""); setRate("");
                    setMaterialType("purchase");
                    setBrand(""); setUnitType(""); setRateType(""); setWorkDone("");
                    setUsage(""); setMachineType(""); setPaymentStatus("");
                    setPaymentMode(""); setPaymentDate(""); setRemarks(""); setPaymentScreenshot(null);
                  }}
                  style={{
                    padding: "14px 0", background: "#fff", color: "#555",
                    border: "1px solid #e5e5e5", borderRadius: 12, fontWeight: 600,
                    fontSize: 15, cursor: "pointer",
                    textAlign: "center",
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
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tx.title}
                          </div>
                          <div style={{ fontSize: 12, color: "#999", display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ padding: "1px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{tx.type}</span>
                            {tx.type === "Materials" && tx.materialType && (
                              <span
                                style={{
                                  padding: "1px 8px",
                                  borderRadius: 20,
                                  background: tx.materialType === "usage" ? "#fef2f2" : "#ecfdf5",
                                  color: tx.materialType === "usage" ? "#b91c1c" : "#166534",
                                  fontWeight: 700,
                                }}
                              >
                                {tx.materialType === "usage" ? "Usage" : "Purchase"}
                              </span>
                            )}
                            {tx.type === "Materials" && tx.quantity
                              ? <span>📦 {tx.quantity} {tx.unit || ""} @ ₹{(tx.rate || 0).toLocaleString("en-IN")}</span>
                              : null
                            }
                            {tx.worker  && <span>👷 {workerLabel(tx.worker)}</span>}
                            {tx.project && <span>🏗️ {projectLabel(tx.project)}</span>}
                            <span>📅 {new Date(tx.date).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: 15, color: tx.type === "Income" ? "#166634" : "#1a1a1a", flexShrink: 0 }}>
                          {tx.type === "Income" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => handleEdit(tx)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: "1px solid #dbeafe", background: "#eff6ff",
                            cursor: "pointer", fontSize: 13, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          title="Edit entry"
                        >✏️</button>

                        {/* Delete button */}
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
      {editTx && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9000, backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "32px 36px",
            width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            fontFamily: "'Segoe UI', sans-serif",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>Edit Transaction</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>Update the details below</p>
              </div>
              <button
                onClick={() => setEditTx(null)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #eee", background: "#f5f5f5", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>

            {/* Type badge (read-only) */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 20, marginBottom: 20,
              background: (TYPE_STYLE[editTx.type] || TYPE_STYLE.Expense).bg,
              color: (TYPE_STYLE[editTx.type] || TYPE_STYLE.Expense).color,
              fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: (TYPE_STYLE[editTx.type] || TYPE_STYLE.Expense).dot }} />
              {editTx.type}
              <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 4 }}>(type cannot be changed)</span>
            </div>

            {editErr && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
                ⚠️ {editErr}
              </div>
            )}

            {/* Fields */}
            {[
              { label: "📋 Title",          key: "title",         type: "text"   },
              { label: "📅 Date",           key: "date",          type: "date"   },
              { label: "📝 Notes",          key: "notes",         type: "textarea"},
              { label: "💬 Remarks",        key: "remarks",       type: "textarea"},
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>{f.label}</div>
                {f.type === "textarea" ? (
                  <textarea
                    value={editTx[f.key]}
                    onChange={e => setEditTx(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={2}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 13, fontFamily: "'Segoe UI', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={editTx[f.key]}
                    onChange={e => setEditTx(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Segoe UI', sans-serif" }}
                  />
                )}
              </div>
            ))}

            {/* Materials: qty + rate */}
            {editTx.type === "Materials" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "📦 Quantity", key: "quantity" },
                  { label: "💵 Rate",     key: "rate"     },
                  { label: "📐 Unit",     key: "unit",    text: true },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>{f.label}</div>
                    <input
                      type={f.text ? "text" : "number"}
                      min="0"
                      value={editTx[f.key]}
                      onChange={e => {
                        const updated = { ...editTx, [f.key]: e.target.value };
                        const q = parseFloat(updated.quantity) || 0;
                        const r = parseFloat(updated.rate)     || 0;
                        if (q > 0 && r > 0) updated.amount = String(q * r);
                        setEditTx(updated);
                      }}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Segoe UI', sans-serif" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>💰 Amount</div>
              <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "10px 13px", gap: 8 }}>
                <span style={{ color: "#ea580c", fontWeight: 700 }}>₹</span>
                <input
                  type="number" min="0"
                  value={editTx.amount}
                  readOnly={editTx.type === "Materials"}
                  onChange={e => setEditTx(prev => ({ ...prev, amount: e.target.value }))}
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, fontFamily: "'Segoe UI', sans-serif", cursor: editTx.type === "Materials" ? "not-allowed" : "text", color: editTx.type === "Materials" ? "#888" : "#1a1a1a" }}
                />
              </div>
            </div>

            {/* Payment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "✅ Payment Status", key: "paymentStatus", opts: ["", "Paid", "Pending", "Partial"] },
                { label: "🏦 Payment Mode",   key: "paymentMode",   opts: ["", "Cash", "UPI", "Bank", "Cheque"] },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>{f.label}</div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={editTx[f.key]}
                      onChange={e => setEditTx(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 13, outline: "none", appearance: "none", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif", background: "#f9f9f9" }}
                    >
                      {f.opts.map(o => <option key={o} value={o}>{o || "Select…"}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 11, pointerEvents: "none" }}>▾</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                style={{
                  padding: "13px 0", background: editSaving ? "#f59561" : "#ea580c",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontWeight: 700, fontSize: 14, cursor: editSaving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(234,88,12,0.25)", transition: "background 0.2s",
                }}
              >
                {editSaving ? "⏳ Saving…" : "💾 Save Changes"}
              </button>
              <button
                onClick={() => setEditTx(null)}
                style={{
                  padding: "13px 0", background: "#f5f5f5", color: "#555",
                  border: "1px solid #e5e5e5", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}