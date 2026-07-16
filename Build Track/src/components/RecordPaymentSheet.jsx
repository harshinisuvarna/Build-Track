import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ArrowLeft,
  CheckCircle,
  Upload,
  Smartphone,
  Banknote,
  Building2,
  CreditCard,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { transactionAPI } from "../api";
import { colors, radius, shadows } from "../styles/designTokens";

const primaryBlue = "#173EEA";
const primaryPurple = "#6B2FD9";

const PAYMENT_METHODS = [
  { value: "UPI", icon: Smartphone },
  { value: "Cash", icon: Banknote },
  { value: "Bank Transfer", icon: Building2 },
  { value: "Card", icon: CreditCard },
  { value: "Cheque", icon: FileText },
];

const STATUS_CONFIG = {
  paid: { label: "Fully Paid", color: "#15803D", bg: "#DCFCE7", border: "#15803D" },
  partial: { label: "Partial", color: "#B45309", bg: "#FEF3C7", border: "#B45309" },
  pending: { label: "Not Paid", color: "#DC2626", bg: "#FEE2E2", border: "#DC2626" },
};

function formatINR(n) {
  return `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;
}

function formatDateShort(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function RecordPaymentSheet({ open, entry, projects, onClose, onSaved }) {
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const rawTx = entry?.rawTx;
  const entryId = rawTx?._id || entry?.id;
  const totalAmount = rawTx?.amount || entry?.amount || 0;
  const alreadyPaid = rawTx?.paidAmount || 0;
  const outstanding = Math.max(0, totalAmount - alreadyPaid);

  const projectName = (() => {
    if (!rawTx?.project) return "Unknown Project";
    if (typeof rawTx.project === "object") return rawTx.project.projectName || rawTx.project.name || "Unknown Project";
    const match = projects?.find((p) => String(p._id) === String(rawTx.project));
    return match ? match.projectName || match.name : "Unknown Project";
  })();

  useEffect(() => {
    if (!open) return;
    const initStatus = outstanding > 0 ? (alreadyPaid > 0 ? "partial" : "pending") : "paid";
    setSelectedStatus(initStatus);
    setSelectedMethod(rawTx?.paymentMode || "UPI");
    setAmount(initStatus === "paid" ? outstanding.toString() : initStatus === "pending" ? "0" : "");
    setNotes(rawTx?.notes || rawTx?.remarks || "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setReceiptFile(null);
    setReceiptPreview(null);
    setError(null);
  }, [open, entryId]);

  const computeHelperText = useCallback(() => {
    if (selectedStatus === "paid") return `Full settlement — ${formatINR(outstanding)}`;
    if (selectedStatus === "pending") return "No payment recorded";
    const entered = parseFloat(amount) || 0;
    const rem = Math.max(0, outstanding - entered);
    return rem > 0 ? `Remaining: ${formatINR(rem)}` : "Full settlement via partial recording";
  }, [selectedStatus, amount, outstanding]);

  const handleAmountChange = (val) => {
    if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
      val = val.replace(/^0+/, "");
      if (!val || val === ".") val = "0";
    }
    setAmount(val);
    setError(null);
    const amt = parseFloat(val) || 0;
    if (amt <= 0) setSelectedStatus("pending");
    else if (amt >= outstanding) setSelectedStatus("paid");
    else setSelectedStatus("partial");
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setError(null);
    if (status === "paid") setAmount(outstanding.toString());
    else if (status === "pending") setAmount("0");
    else if (status === "partial") {
      if (amount === "0" || amount === outstanding.toString()) setAmount("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (selectedStatus !== "pending") {
      const raw = amount.trim();
      const amt = parseFloat(raw);
      if (!raw || isNaN(amt) || amt <= 0) {
        setError("Enter a valid amount paid");
        return;
      }
      if (outstanding > 0 && amt > outstanding) {
        setError("Payment amount cannot exceed the outstanding amount.");
        return;
      }
      if (outstanding <= 0) {
        setError("No outstanding amount to pay");
        return;
      }
    }

    const amt = selectedStatus === "paid" ? outstanding : selectedStatus === "pending" ? 0 : (parseFloat(amount) || 0);
    setSaving(true);
    setError(null);

    try {
      const totalPaid = alreadyPaid + amt;
      const statusStr = selectedStatus === "paid" ? "Paid" : selectedStatus === "partial" ? "Partial" : "Pending";

      let apiPaymentMode = selectedMethod;
      if (apiPaymentMode === "Bank Transfer" || apiPaymentMode === "Card") apiPaymentMode = "Bank";

      const payload = {
        paymentStatus: statusStr,
        paidAmount: totalPaid,
        paymentMode: apiPaymentMode,
        notes: notes.trim(),
        paymentDate: new Date(paymentDate).toISOString(),
      };

      if (receiptFile) {
        const reader = new FileReader();
        const dataUri = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(receiptFile);
        });
        payload.paymentReceipt = dataUri;
      }

      await transactionAPI.update(entryId, payload);
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !entry) return null;

  const helperText = error || computeHelperText();
  const isError = !!error;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          background: "#F4F5FF",
          borderRadius: "22px 22px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 38, height: 4, borderRadius: 16, background: "#BDBEE8" }} />
        </div>

        {/* Nav Row */}
        <div style={{ padding: "8px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#EEF1FF",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} color={primaryBlue} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#1E1E2E", flex: 1 }}>
            Fulfillment & Payment
          </span>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
          {/* Gradient Header Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #173EEA 0%, #6B2FD9 100%)",
              borderRadius: 16,
              padding: "16px",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8.5, fontWeight: 800, color: "rgba(255,255,255,0.54)", letterSpacing: 1.3, marginBottom: 4 }}>
                  FULFILLMENT & PAYMENT
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: "#FFF",
                    lineHeight: 1.2,
                    letterSpacing: -0.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {entry.description || entry.brand || "Entry"}
                </div>
                {(entry.type || projectName) && (
                  <div style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(255,255,255,0.54)", marginTop: 3 }}>
                    {[entry.type?.toUpperCase(), projectName].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.54)", letterSpacing: 1.2 }}>
                  OUTSTANDING
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#FFF", letterSpacing: -0.5, marginTop: 4 }}>
                  {formatINR(outstanding)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  {formatINR(alreadyPaid)} paid
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: 1.0, marginBottom: 8 }}>
            PAYMENT STATUS
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleStatusSelect(key)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 10,
                  border: `1.5px solid ${selectedStatus === key ? cfg.border : "#E2E4F6"}`,
                  background: selectedStatus === key ? cfg.bg : "#FFF",
                  color: selectedStatus === key ? cfg.color : "#6B7280",
                  fontSize: 12.5,
                  fontWeight: selectedStatus === key ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Payment Method */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: 1.0, marginBottom: 8 }}>
            PAYMENT METHOD
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const sel = selectedMethod === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setSelectedMethod(m.value)}
                  style={{
                    flex: "1 1 calc(50% - 4px)",
                    minWidth: 0,
                    height: 46,
                    borderRadius: 10,
                    border: `1.5px solid ${sel ? primaryBlue : "#E2E4F6"}`,
                    background: sel ? "#EEF1FF" : "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={16} color={sel ? primaryBlue : "#6B7280"} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: sel ? 800 : 600,
                      color: sel ? primaryBlue : "#1E1E2E",
                    }}
                  >
                    {m.value}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Amount Field */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: 1.0, marginBottom: 8 }}>
            ACTUAL AMOUNT PAID ({"\u20B9"})
          </div>
          <div
            style={{
              height: 60,
              borderRadius: 12,
              border: `1.5px solid ${isError ? "#DC2626" : "#E2E4F6"}`,
              background: "#FFF",
              display: "flex",
              alignItems: "center",
              opacity: selectedStatus === "pending" ? 0.4 : 1,
              marginBottom: 5,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "#6B7280", paddingLeft: 16 }}>
              {"\u20B9"}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={selectedStatus === "pending"}
              placeholder="0.00"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 20,
                fontWeight: 800,
                color: "#1E1E2E",
                outline: "none",
                paddingLeft: 8,
                paddingRight: 16,
                height: "100%",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              fontStyle: isError ? "italic" : "normal",
              color: isError ? "#DC2626" : "#6B7280",
              marginBottom: 20,
              paddingLeft: 2,
            }}
          >
            {helperText}
          </div>

          {/* Payment Receipt */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: 1.0, marginBottom: 8 }}>
            PAYMENT RECEIPT
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div
            onClick={() => !receiptFile && fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: `1.5px solid ${receiptFile ? "#15803D" : "#CCCFE8"}`,
              background: receiptFile ? "#F0FDF4" : "#FFF",
              cursor: receiptFile ? "default" : "pointer",
              marginBottom: 20,
              transition: "all 0.15s",
            }}
          >
            {receiptFile ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={18} color="#15803D" />
                <span
                  style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#15803D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {receiptFile.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    fileInputRef.current.value = "";
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#EEEFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Upload size={16} color={primaryBlue} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E1E2E" }}>Upload Payment Receipt</div>
                  <div style={{ fontSize: 10.5, fontWeight: 500, color: "#6B7280", marginTop: 1 }}>
                    PNG, JPG, PDF — UPI / Bank / Cheque proof
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Date */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: 1.0, marginBottom: 8 }}>
            PAYMENT DATE
          </div>
          <div
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1.5px solid #CCCFE8",
              background: "#FFF",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => document.getElementById("rp-date-input")?.showPicker?.()}
          >
            <Calendar size={18} color={primaryBlue} />
            <input
              id="rp-date-input"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 14,
                fontWeight: 700,
                color: "#1E1E2E",
                outline: "none",
                flex: 1,
                cursor: "pointer",
              }}
            />
          </div>

          {/* Remarks */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: 1.0, marginBottom: 8 }}>
            REMARKS / REFERENCE NUMBER
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transaction ID, cheque number, or remarks…"
            rows={3}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1.5px solid #CCCFE8",
              background: "#FFF",
              fontSize: 13,
              color: "#1E1E2E",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Sticky Bottom Buttons */}
        <div
          style={{
            padding: "12px 16px 16px",
            background: "#FFF",
            borderTop: "1px solid #E8EAFF",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 2,
              height: 48,
              borderRadius: 12,
              border: "1.5px solid #DDE0F0",
              background: "#FFF",
              fontSize: 14,
              fontWeight: 700,
              color: "#6B7280",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              flex: 5,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #173EEA, #6B2FD9)",
              border: "none",
              fontSize: 13,
              fontWeight: 800,
              color: "#FFF",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 3px 12px rgba(23,62,234,0.3)",
            }}
          >
            {saving ? (
              <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Confirm Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
