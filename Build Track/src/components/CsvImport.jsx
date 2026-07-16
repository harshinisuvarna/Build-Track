import { useState, useRef } from "react";

const MATERIAL_TEMPLATE_HEADERS = [
  "Date", "Project", "Floor", "Phase", "Activity", "Material / Item", "Unit",
  "Quantity", "Rate", "Brand", "Category", "Supplier", "IsWithGst", "GstPercentage", "Notes"
];

const LABOUR_TEMPLATE_HEADERS = [
  "Date", "Project", "Floor", "Phase", "Activity", "Labour Type", "Unit",
  "Quantity", "Rate", "Trade / Work Type", "Contractor / Team", "Overtime Amount", "Notes"
];

const EQUIPMENT_TEMPLATE_HEADERS = [
  "Date", "Project", "Floor", "Phase", "Activity", "Equipment Name", "Unit",
  "Quantity", "Rate", "Machinery Sub-Class / Model", "Operator / Vendor",
  "IsWithGst", "GstPercentage", "Notes"
];

const ALL_TEMPLATE_HEADERS = [
  "Date", "Project", "Floor", "Phase", "Activity", "Type", "Name",
  "Category / Trade", "Subtype", "Brand", "Supplier / Operator",
  "Quantity", "Unit", "Rate", "Overtime", "IsWithGst", "GstPercentage",
  "Payment Status", "Notes"
];

const COLUMN_MAPPINGS = {
  material: {
    "Material / Item": "title",
    "Material Name": "title",
    "Item Name": "title",
    "Name": "title",
    "Unit": "unit",
    "Quantity": "quantity",
    "Qty": "quantity",
    "Rate": "rate",
    "Rate (₹)": "rate",
    "Brand": "brand",
    "Category": "category",
    "Supplier": "supplier",
    "Date": "date",
    "Floor": "floor",
    "Phase": "phase",
    "Activity": "activity",
    "IsWithGst": "isWithGst",
    "GstPercentage": "gstPercentage",
    "Notes": "notes",
  },
  labour: {
    "Labour Type": "title",
    "Worker Name": "title",
    "Name": "title",
    "Unit": "unit",
    "Quantity": "quantity",
    "Number of Workers": "quantity",
    "Rate": "rate",
    "Rate per Worker": "rate",
    "Trade / Work Type": "workType",
    "Contractor / Team": "contractor",
    "Contractor": "contractor",
    "Overtime Amount": "overtime",
    "Date": "date",
    "Floor": "floor",
    "Phase": "phase",
    "Activity": "activity",
    "Notes": "notes",
  },
  equipment: {
    "Equipment Name": "title",
    "Name": "title",
    "Unit": "unit",
    "Quantity": "quantity",
    "Hours/Days": "quantity",
    "Rate": "rate",
    "Rate (₹)": "rate",
    "Machinery Sub-Class / Model": "model",
    "Model": "model",
    "Operator / Vendor": "operator",
    "Operator": "operator",
    "Date": "date",
    "Floor": "floor",
    "Phase": "phase",
    "Activity": "activity",
    "IsWithGst": "isWithGst",
    "GstPercentage": "gstPercentage",
    "Notes": "notes",
  },
  all: {
    "Type": "type",
    "Name": "title",
    "Title": "title",
    "Unit": "unit",
    "Quantity": "quantity",
    "Qty": "quantity",
    "Rate": "rate",
    "Rate (₹)": "rate",
    "Category / Trade": "category",
    "Category": "category",
    "Subtype": "subtype",
    "Brand": "brand",
    "Supplier / Operator": "supplier",
    "Supplier": "supplier",
    "Operator": "operator",
    "Overtime": "overtime",
    "IsWithGst": "isWithGst",
    "GstPercentage": "gstPercentage",
    "Payment Status": "paymentStatus",
    "Date": "date",
    "Floor": "floor",
    "Phase": "phase",
    "Activity": "activity",
    "Notes": "notes",
  },
};

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [], error: "CSV must have a header row and at least one data row" };
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/\s+/g, " "));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map(v => v.trim());
    if (vals.length >= headers.length - 1 && vals.some(v => v)) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
      rows.push(row);
    }
  }
  return { headers, rows, error: null };
}

function detectEntryType(headers) {
  const headerStr = headers.join(" ").toLowerCase();
  if (headerStr.includes("material") || headerStr.includes("brand") || headerStr.includes("supplier")) return "material";
  if (headerStr.includes("worker") || headerStr.includes("wage") || headerStr.includes("labour") || headerStr.includes("overtime")) return "labour";
  if (headerStr.includes("machine") || headerStr.includes("equipment") || headerStr.includes("rental") || headerStr.includes("operator")) return "equipment";
  if (headerStr.includes("type") && (headerStr.includes("material") || headerStr.includes("labour") || headerStr.includes("equipment"))) return "all";
  return null;
}

function mapRowToPayload(row, detectedType, columnMapping) {
  const payload = {};
  
  for (const [csvCol, dbField] of Object.entries(columnMapping)) {
    const val = row[csvCol] || "";
    if (!val) continue;
    
    switch (dbField) {
      case "quantity":
      case "rate":
      case "overtime":
      case "gstPercentage":
        payload[dbField] = Number(val) || 0;
        break;
      case "isWithGst":
        payload[dbField] = val.toLowerCase() === "yes" || val.toLowerCase() === "true" || val === "1";
        break;
      default:
        payload[dbField] = val;
    }
  }
  
  if (!payload.type) {
    const typeMap = { material: "Materials", labour: "Wages", equipment: "Expense" };
    payload.type = typeMap[detectedType] || "Expense";
  }
  
  return payload;
}

export default function CsvImport({ projectId, onComplete }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("all");
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importErrors, setImportErrors] = useState([]);

  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }
    setError("");
    setResult(null);
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { headers, rows, error: parseError } = parseCsv(e.target.result);
        if (parseError) { setError(parseError); setParsing(false); return; }
        
        const detectedType = detectEntryType(headers);
        setSelectedTemplate(detectedType || "all");
        setPreview({ headers, rows, total: rows.length, detectedType });
      } catch {
        setError("Failed to parse CSV file");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!preview || !projectId) return;
    setImporting(true);
    setError("");
    setImportErrors([]);
    setImportProgress({ current: 0, total: preview.total });
    
    let success = 0;
    let failed = 0;
    const errors = [];
    
    const columnMapping = COLUMN_MAPPINGS[selectedTemplate] || COLUMN_MAPPINGS.all;
    
    for (let i = 0; i < preview.rows.length; i++) {
      try {
        const row = preview.rows[i];
        const payload = mapRowToPayload(row, selectedTemplate, columnMapping);
        
        if (!payload.title || payload.title.trim() === "") {
          throw new Error("Missing required field: Name/Title");
        }
        if (!payload.quantity || payload.quantity <= 0) {
          throw new Error("Quantity must be greater than 0");
        }
        if (!payload.rate || payload.rate <= 0) {
          throw new Error("Rate must be greater than 0");
        }
        
        const fd = new FormData();
        fd.append("title", payload.title || "Untitled");
        fd.append("type", payload.type || "Expense");
        fd.append("amount", (payload.quantity || 0) * (payload.rate || 0));
        fd.append("project", projectId);
        fd.append("date", payload.date ? new Date(payload.date).toISOString() : new Date().toISOString());
        fd.append("quantity", payload.quantity || 0);
        fd.append("rate", payload.rate || 0);
        fd.append("unit", payload.unit || "");
        fd.append("brand", payload.brand || "");
        fd.append("supplier", payload.supplier || "");
        fd.append("workerName", payload.workerName || payload.title || "");
        fd.append("equipmentName", payload.equipmentName || payload.title || "");
        fd.append("workType", payload.workType || "");
        fd.append("contractor", payload.contractor || "");
        fd.append("model", payload.model || "");
        fd.append("operator", payload.operator || "");
        fd.append("floor", payload.floor || "");
        fd.append("phase", payload.phase || "");
        fd.append("activity", payload.activity || "");
        fd.append("isWithGst", payload.isWithGst || false);
        fd.append("gstPercentage", payload.gstPercentage || 0);
        fd.append("overtime", payload.overtime || 0);
        fd.append("paymentStatus", payload.paymentStatus || "Pending");
        fd.append("notes", payload.notes || "");

        await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("bt_token")}` },
          body: fd,
        }).then(r => { 
          if (!r.ok) throw new Error(`HTTP ${r.status}`); 
          return r.json(); 
        });
        
        success++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, message: err.message || "Import failed" });
      }
      
      setImportProgress({ current: i + 1, total: preview.total });
    }
    
    setResult({ success, failed, total: preview.total });
    setImportErrors(errors);
    setImporting(false);
    if (onComplete) onComplete({ success, failed });
  };

  const downloadTemplate = (type) => {
    let headers, filename;
    if (type === "material") {
      headers = MATERIAL_TEMPLATE_HEADERS;
      filename = "material_entries_template.csv";
    } else if (type === "labour") {
      headers = LABOUR_TEMPLATE_HEADERS;
      filename = "labour_entries_template.csv";
    } else if (type === "equipment") {
      headers = EQUIPMENT_TEMPLATE_HEADERS;
      filename = "equipment_entries_template.csv";
    } else {
      headers = ALL_TEMPLATE_HEADERS;
      filename = "all_entries_template.csv";
    }
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e5e5", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>CSV Bulk Import</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Import multiple entries at once from a CSV file</div>
        </div>
      </div>

      {/* Template Selection */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          SELECT TEMPLATE
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All Types" },
            { key: "material", label: "Material" },
            { key: "labour", label: "Labour" },
            { key: "equipment", label: "Equipment" },
          ].map(t => (
            <button key={t.key} onClick={() => setSelectedTemplate(t.key)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: `1px solid ${selectedTemplate === t.key ? "#3730a3" : "#e5e5e5"}`,
                background: selectedTemplate === t.key ? "#eef2ff" : "#fafafa",
                color: selectedTemplate === t.key ? "#3730a3" : "#555",
                fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Download Template */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => downloadTemplate(selectedTemplate)}
          style={{
            flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e5e5e5",
            background: "#f3f4f6", fontSize: 12, fontWeight: 600, color: "#555",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Template
        </button>
      </div>

      {/* File Upload */}
      <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])} />

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragOver ? "#ea580c" : "#e5e5e5"}`,
          borderRadius: 12, padding: "28px 20px", textAlign: "center",
          background: dragOver ? "#fff5f0" : "#fafafa", cursor: "pointer",
          transition: "all 0.2s", marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>
          {parsing ? "Parsing…" : "Click to upload or drag and drop"}
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>CSV files only</div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#991b1b", fontSize: 13, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#555" }}>
              <strong>{preview.total}</strong> rows found
              {preview.detectedType && (
                <span style={{ marginLeft: 8, padding: "2px 8px", background: "#eef2ff", color: "#3730a3", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                  Auto-detected: {preview.detectedType}
                </span>
              )}
            </div>
            <button onClick={doImport} disabled={importing || !projectId}
              style={{
                padding: "8px 20px", background: importing ? "#f59561" : "#ea580c", color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: importing || !projectId ? "not-allowed" : "pointer",
              }}>
              {importing ? `Importing ${importProgress.current}/${importProgress.total}…` : `Import ${preview.total} Entries`}
            </button>
          </div>
          
          {/* Progress Bar */}
          {importing && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "#ea580c", borderRadius: 3,
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                  transition: "width 0.3s",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4, textAlign: "center" }}>
                Processing row {importProgress.current} of {importProgress.total}
              </div>
            </div>
          )}
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {preview.headers.slice(0, 8).map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    {preview.headers.slice(0, 8).map(h => (
                      <td key={h} style={{ padding: "8px 10px", color: "#333" }}>{row[h] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.total > 5 && (
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8, textAlign: "center" }}>Showing 5 of {preview.total} rows</div>
          )}
          {!projectId && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 8 }}>⚠️ Please select a project in the execution context above before importing.</div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div style={{ 
            background: result.failed ? "#fef9c3" : "#dcfce7", 
            border: `1px solid ${result.failed ? "#fde047" : "#86efac"}`, 
            borderRadius: 10, padding: "14px 16px", fontSize: 13, marginBottom: 12 
          }}>
            {result.failed ? "⚠️" : "✅"} Imported <strong>{result.success}</strong> of {result.total} entries
            {result.failed > 0 && <span style={{ color: "#991b1b" }}> ({result.failed} failed)</span>}
          </div>
          
          {/* Error Summary */}
          {importErrors.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "14px 16px", fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>Import Errors:</div>
              <div style={{ maxHeight: 150, overflowY: "auto" }}>
                {importErrors.map((err, idx) => (
                  <div key={idx} style={{ padding: "4px 0", color: "#991b1b", borderBottom: "1px solid #FCA5A5" }}>
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button onClick={() => { setResult(null); setPreview(null); setImportErrors([]); }}
            style={{
              marginTop: 12, padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e5e5",
              background: "#f3f4f6", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer",
            }}>
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
