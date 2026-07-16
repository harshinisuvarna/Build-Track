import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Upload,
  Smartphone,
  Banknote,
  Building2,
  CreditCard,
  FileText,
  Calendar,
  X,
} from "lucide-react";
import { transactionAPI } from "../api";

const primaryBlue = "#173EEA";

const PAYMENT_METHODS = [
  { value: "UPI", icon: Smartphone },
  { value: "Cash", icon: Banknote },
  { value: "Bank Transfer", icon: Building2 },
  { value: "Card", icon: CreditCard },
  { value: "Cheque", icon: FileText },
];

const STATUS_OPTIONS = [
  { key: "paid", label: "Fully Paid", color: "#15803D", bg: "#DCFCE7" },
  { key: "partial", label: "Partial", color: "#B45309", bg: "#FEF3C7" },
  { key: "pending", label: "Not Paid", color: "#DC2626", bg: "#FEE2E2" },
];

function formatINR(n) {
  return `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;
}

function parseAmount(val) {
  if (!val || val.trim() === "") return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

export default function RecordPaymentSheet({ open, entry, projects, onClose, onSaved }) {
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [amountError, setAmountError] = useState(null);
  const fileInputRef = useRef(null);
  const amountRef = useRef(null);

  const rawTx = entry?.rawTx;
  const entryId = rawTx?._id || entry?.id;

  // Compute totals from raw transaction, matching Flutter's argument extraction
  const totalAmount = (() => {
    if (rawTx?.amount != null) return rawTx.amount;
    if (entry?.amount != null) return entry.amount;
    const qty = rawTx?.quantity || 0;
    const rate = rawTx?.rate || 0;
    const ot = rawTx?.overtime || 0;
    if (rawTx?.type === "Wages") return qty * rate + ot;
    return qty * rate;
  })();

  const alreadyPaid = rawTx?.paidAmount || 0;
  const outstanding = Math.max(0, totalAmount - alreadyPaid);

  const quantity = rawTx?.quantity || 0;
  const ratePerUnit = rawTx?.rate || 0;

  const projectName = (() => {
    if (!rawTx?.project) return "Unknown Project";
    if (typeof rawTx.project === "object")
      return rawTx.project.projectName || rawTx.project.name || "Unknown Project";
    const match = projects?.find((p) => String(p._id) === String(rawTx.project));
    return match ? match.projectName || match.name : "Unknown Project";
  })();

  const itemType = (rawTx?.type || entry?.type || "material").toUpperCase();

  // Initialize state on open — matches Flutter didChangeDependencies exactly
  useEffect(() => {
    if (!open) return;

    // Flutter: _selectedStatus = _outstanding > 0 ? (_alreadyPaid > 0 ? partial : pending) : paid
    const initStatus = outstanding > 0 ? (alreadyPaid > 0 ? "partial" : "pending") : "paid";
    setSelectedStatus(initStatus);

    // Flutter: _selectedMethod from args or 'UPI', with Bank→Bank Transfer mapping
    let method = rawTx?.paymentMode || "UPI";
    if (method === "Bank") method = "Bank Transfer";
    if (!PAYMENT_METHODS.some((m) => m.value === method)) method = "UPI";
    setSelectedMethod(method);

    // Flutter: if paid → outstanding.toStringAsFixed(0); if pending → '0'; else empty
    if (initStatus === "paid") {
      setAmount(outstanding > 0 ? outstanding.toString() : totalAmount.toString());
    } else if (initStatus === "pending") {
      setAmount("0");
    } else {
      setAmount("");
    }

    setNotes(rawTx?.notes || rawTx?.remarks || "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setReceiptFile(null);
    setAmountError(null);
  }, [open, entryId]);

  // Helper text — matches Flutter build() exactly
  const computeHelperText = useCallback(() => {
    if (selectedStatus === "paid") {
      return `Full settlement — ${formatINR(outstanding > 0 ? outstanding : totalAmount)}`;
    }
    if (selectedStatus === "pending") return "No payment recorded";
    const entered = parseAmount(amount) ?? 0;
    const rem = Math.max(0, outstanding - entered);
    return rem > 0 ? `Remaining: ${formatINR(rem)}` : "Full settlement via partial recording";
  }, [selectedStatus, amount, outstanding, totalAmount]);

  // Amount onChange — matches Flutter onChanged exactly
  const handleAmountChange = (val) => {
    // Strip leading zeros (but keep "0." decimals) — matches Flutter RegExp
    if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
      const stripped = val.replace(/^0+/, "");
      if (stripped && stripped !== ".") val = stripped;
    }
    setAmount(val);
    setAmountError(null);

    // Auto-detect status from amount — matches Flutter logic including outstanding==0 case
    const amt = parseAmount(val);
    if (amt == null || amt === 0) {
      setSelectedStatus("pending");
    } else if (outstanding > 0 && amt >= outstanding) {
      setSelectedStatus("paid");
    } else if (outstanding === 0 && amt >= totalAmount) {
      setSelectedStatus("paid");
    } else {
      setSelectedStatus("partial");
    }
  };

  // Status chip click — matches Flutter status card onTap exactly
  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setAmountError(null);
    if (status === "paid") {
      setAmount(outstanding > 0 ? outstanding.toString() : totalAmount.toString());
    } else if (status === "pending") {
      setAmount("0");
    } else if (status === "partial") {
      // Flutter: clear if current text is '0' or equals the outstanding value
      const currentAmt = outstanding > 0 ? outstanding.toString() : totalAmount.toString();
      if (amount === "0" || amount === currentAmt) {
        setAmount("");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
  };

  // Confirm — matches Flutter _handleConfirmPayment exactly
  const handleConfirm = async () => {
    // Validation — identical to Flutter
    if (selectedStatus !== "pending") {
      const raw = amount.trim();
      const amt = parseAmount(raw);
      if (raw === "" || amt === null || amt <= 0) {
        setAmountError("Enter a valid amount paid");
        return;
      }
      if (outstanding > 0 && amt > outstanding) {
        setAmountError("Payment amount cannot exceed the outstanding amount.");
        return;
      }
      if (outstanding <= 0) {
        setAmountError("No outstanding amount to pay");
        return;
      }
    }

    // Amount calculation — identical to Flutter
    const amt =
      selectedStatus === "paid"
        ? outstanding > 0 ? outstanding : totalAmount
        : selectedStatus === "pending"
        ? 0.0
        : parseAmount(amount.trim()) ?? 0.0;

    setSaving(true);
    setAmountError(null);

    try {
      const totalPaid = alreadyPaid + amt;

      // Status string — identical to Flutter
      const statusStr =
        selectedStatus === "paid"
          ? "Paid"
          : selectedStatus === "partial"
          ? "Partial"
          : "Pending";

      // Payment mode — identical to Flutter: Bank Transfer/Card → Bank
      let apiPaymentMode = selectedMethod;
      if (apiPaymentMode === "Bank Transfer" || apiPaymentMode === "Card") {
        apiPaymentMode = "Bank";
      }

      // Build payload — identical to Flutter payload
      const payload = {
        paymentStatus: statusStr,
        paidAmount: totalPaid,
        paymentMode: apiPaymentMode,
        notes: notes.trim(),
        paymentDate: new Date(paymentDate).toISOString(),
      };

      // Receipt — Flutter only sends if _newReceiptDataUri != null
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

      // Flutter success toast matches: "₹X recorded via Method" or "Payment details updated successfully"
      const toastMsg =
        amt > 0
          ? `${formatINR(amt)} recorded via ${selectedMethod}`
          : "Payment details updated successfully";

      onSaved?.(toastMsg);
      onClose?.();
    } catch (err) {
      // Flutter error handling: "Failed to update payment on server" + generic catch
      const msg =
        err?.response?.data?.message ||
        err?.friendlyMessage ||
        `Error: ${err.message || "Failed to update payment on server"}`;
      setAmountError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !entry) return null;

  const displayError = amountError;
  const helperText = displayError || computeHelperText();
  const isError = !!displayError;

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
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose?.();
      }}
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
        {/* Handle bar */}
        <div style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 38, height: 4, borderRadius: 16, background: "#BDBEE8" }} />
        </div>

        {/* Nav Row — matches Flutter: padding 16,12,16,12 */}
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          {/* Back button — Flutter: w38 h38 r12 white bg, border #E2E4F6 */}
          <button
            onClick={saving ? undefined : onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "#FFF",
              border: "1px solid #E2E4F6",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} color={primaryBlue} />
          </button>
          {/* Title — Flutter: fontSize 18, fontWeight w800 */}
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1E1E2E", flex: 1 }}>
            Fulfillment &amp; Payment
          </span>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
          {/* ── GRADIENT HEADER CARD ── Flutter: padding 18, borderRadius 18 */}
          <div
            style={{
              width: "100%",
              padding: 18,
              borderRadius: 18,
              background: "linear-gradient(135deg, #173EEA 0%, #6B2FD9 100%)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", gap: 16 }}>
              {/* Left: item info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Label — Flutter: fontSize 9, color white54 */}
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.54)",
                    letterSpacing: 1.3,
                    marginBottom: 6,
                  }}
                >
                  INVENTORY ITEM DETAILS
                </div>
                {/* Item name — Flutter: fontSize 18, fontWeight w900 */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#FFF",
                    lineHeight: 1.2,
                    letterSpacing: -0.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    marginBottom: 6,
                  }}
                >
                  {entry.description || entry.brand || rawTx?.title || "Entry"}
                </div>
                {/* Type · Project — Flutter: fontSize 11, color white70 */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  {itemType} · {projectName || "Project"}
                </div>
                {/* Qty @ Rate — Flutter: show only if qty > 0 && rate > 0 */}
                {quantity > 0 && ratePerUnit > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: 4,
                    }}
                  >
                    Qty: {Number.isInteger(quantity) ? quantity : quantity} @{" "}
                    {"\u20B9"}
                    {Number.isInteger(ratePerUnit) ? ratePerUnit : ratePerUnit}
                  </div>
                )}
              </div>

              {/* Right: outstanding — Flutter: fontSize 22 for amount */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {/* Label — Flutter: fontSize 9, color white54 */}
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.54)",
                    letterSpacing: 1.2,
                  }}
                >
                  OUTSTANDING
                </div>
                {/* Amount — Flutter: fontSize 22, fontWeight w900 */}
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#FFF",
                    letterSpacing: -0.5,
                    marginTop: 6,
                  }}
                >
                  {formatINR(outstanding)}
                </div>
                {/* Already paid — Flutter: fontSize 11, color white70 */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                  {formatINR(alreadyPaid)} paid
                </div>
              </div>
            </div>
          </div>

          {/* ── PAYMENT STATUS ── Flutter: _pStatusCard with dot indicator */}
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6B7280", letterSpacing: 1.1, marginBottom: 8 }}>
            PAYMENT STATUS
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {STATUS_OPTIONS.map((opt) => {
              const sel = selectedStatus === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleStatusSelect(opt.key)}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    border: `1.5px solid ${sel ? opt.color : "#E2E4F6"}`,
                    background: sel ? opt.bg : "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    cursor: "pointer",
                    transition: "all 0.16s ease",
                  }}
                >
                  {/* Dot — Flutter: w7 h7 circle */}
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: opt.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: sel ? opt.color : "#374151",
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── PAYMENT METHOD ── Flutter: first 4 in 2x2, Cheque full-width */}
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6B7280", letterSpacing: 1.1, marginBottom: 8 }}>
            PAYMENT METHOD
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {PAYMENT_METHODS.map((m, idx) => {
              const Icon = m.icon;
              const sel = selectedMethod === m.value;
              // Flutter: first 4 use chipW (50%), Cheque uses fullW (100%)
              const isFullWidth = idx === 4;
              return (
                <button
                  key={m.value}
                  onClick={() => setSelectedMethod(m.value)}
                  style={{
                    flex: isFullWidth ? "1 1 100%" : "1 1 calc(50% - 4px)",
                    height: 46,
                    borderRadius: 12,
                    border: `1.5px solid ${sel ? primaryBlue : "#E2E4F6"}`,
                    // Flutter: selected bg is solid #173EEA, not light tint
                    background: sel ? primaryBlue : "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.16s ease",
                    // Flutter: selected has box shadow
                    boxShadow: sel ? "0 2px 6px rgba(23,62,234,0.18)" : "none",
                  }}
                >
                  <Icon
                    size={16}
                    // Flutter: selected icon is white
                    color={sel ? "#FFF" : "#6B7280"}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      // Flutter: selected text is white
                      color: sel ? "#FFF" : "#374151",
                    }}
                  >
                    {m.value}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── AMOUNT FIELD ── Flutter: height 60, AnimatedOpacity 0.4 when pending */}
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6B7280", letterSpacing: 1.1, marginBottom: 8 }}>
            ACTUAL AMOUNT PAID ({"\u20B9"})
          </div>
          <div
            style={{
              height: 60,
              opacity: selectedStatus === "pending" ? 0.4 : 1.0,
              transition: "opacity 0.18s ease",
            }}
          >
            <div
              style={{
                height: 60,
                borderRadius: 12,
                background: "#FFF",
                display: "flex",
                alignItems: "center",
                border: `1px solid ${isError ? "#DC2626" : "#E2E4F6"}`,
              }}
            >
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={selectedStatus === "pending"}
                placeholder="0.00"
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1E1E2E",
                  outline: "none",
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              />
            </div>
          </div>
          {/* Helper / error text — Flutter: top 5, left 2, fontSize 11 */}
          <div
            style={{
              marginTop: 5,
              paddingLeft: 2,
              fontSize: 11,
              fontWeight: 500,
              fontStyle: isError ? "italic" : "normal",
              color: isError ? "#DC2626" : "#6B7280",
            }}
          >
            {helperText}
          </div>

          {/* ── PAYMENT RECEIPT ── Flutter: v13 padding, r12, border #CCCFE8 */}
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6B7280", letterSpacing: 1.1, marginTop: 20, marginBottom: 8 }}>
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
              padding: "13px 16px",
              borderRadius: 12,
              border: `1.5px solid ${receiptFile ? "#15803D" : "#CCCFE8"}`,
              background: receiptFile ? "#F0FDF4" : "#FFF",
              cursor: receiptFile ? "default" : "pointer",
              marginBottom: 12,
              transition: "all 0.18s ease",
            }}
          >
            {receiptFile ? (
              /* Uploaded state — matches Flutter */
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={18} color="#15803D" />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#15803D",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {receiptFile.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReceiptFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6B7280",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              /* Empty state — matches Flutter: icon w34 h34 r9 */
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#EEEFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Upload size={17} color={primaryBlue} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E1E2E" }}>
                    Upload Payment Receipt
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 500, color: "#6B7280", marginTop: 1 }}>
                    PNG, JPG, PDF — UPI / Bank / Cheque proof
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── PAYMENT DATE ── Flutter: v13 padding, r12, border #CCCFE8, icon 19px */}
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6B7280", letterSpacing: 1.1, marginBottom: 8 }}>
            PAYMENT DATE
          </div>
          <div
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: "1.5px solid #CCCFE8",
              background: "#FFF",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Calendar size={19} color={primaryBlue} />
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
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

          {/* ── REMARKS ── Flutter: no section label, just EntryNotesField directly */}
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
          <div style={{ height: 6 }} />
        </div>

        {/* ── STICKY BOTTOM BUTTONS ── Flutter: padding 16,12,16,botPad/18 */}
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
          {/* Cancel — Flutter: flex 2, height 46, r11, border #DDE0F0 */}
          <button
            onClick={saving ? undefined : onClose}
            style={{
              flex: 2,
              height: 46,
              borderRadius: 11,
              border: "1.5px solid #DDE0F0",
              background: "#FFF",
              fontSize: 13,
              fontWeight: 700,
              color: "#6B7280",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          {/* Confirm — Flutter: flex 5, height 46, r11, gradient, shadow */}
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              flex: 5,
              height: 46,
              borderRadius: 11,
              background: "linear-gradient(135deg, #173EEA, #6B2FD9)",
              border: "none",
              fontSize: 12,
              fontWeight: 800,
              color: "#FFF",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 3px 8px rgba(23,62,234,0.25)",
            }}
          >
            {saving ? (
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#FFF",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            ) : (
              <>
                <CheckCircle size={16} />
                <span style={{ whiteSpace: "nowrap" }}>Confirm Payment &amp; Update Inventory</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
