import { useState, useRef } from "react";
import { projectAPI } from "../api";

const REQUIRED_HEADERS = ["title", "type", "amount"];

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [], error: "CSV must have a header row and at least one data row" };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map(v => v.trim());
    if (vals.length >= headers.length && vals.some(v => v)) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
      rows.push(row);
    }
  }
  return { headers, rows, error: null };
}

function detectType(headers) {
  const h = headers.join(" ");
  if (h.includes("worker") || h.includes("wage") || h.includes("overtime")) return "Wages";
  if (h.includes("material") || h.includes("brand") || h.includes("supplier")) return "Materials";
  if (h.includes("machine") || h.includes("equipment") || h.includes("rental")) return "Expense";
  return null;
}

export default function CsvImport({ projectId, onComplete }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

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
        const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missing.length) {
          setError(`Missing required columns: ${missing.join(", ")}. Required: title, type, amount`);
          setParsing(false);
          return;
        }
        const detectedType = detectType(headers);
        setPreview({ headers, rows: rows.slice(0, 5), total: rows.length, detectedType });
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
    let success = 0;
    let failed = 0;
    for (const row of preview.rows) {
      try {
        const fd = new FormData();
        fd.append("title", row.title || "Untitled");
        fd.append("type", row.type || preview.detectedType || "Expense");
        fd.append("amount", Number(row.amount) || 0);
        fd.append("project", projectId);
        if (row.quantity) fd.append("quantity", row.quantity);
        if (row.unit) fd.append("unit", row.unit);
        if (row.rate) fd.append("rate", row.rate);
        if (row.category) fd.append("category", row.category);
        if (row.brand) fd.append("brand", row.brand);
        if (row.supplier) fd.append("supplier", row.supplier);
        if (row.worker) fd.append("worker", row.worker);
        if (row.date) fd.append("date", row.date);
        if (row.notes) fd.append("notes", row.notes);
        if (row.floor) fd.append("floor", row.floor);
        if (row.phase) fd.append("phase", row.phase);
        if (row.activity) fd.append("activity", row.activity);
        await projectAPI.importPhases ? fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("bt_token")}` },
          body: fd,
        }).then(r => { if (!r.ok) throw new Error(); return r.json(); }) : null;
        success++;
      } catch {
        failed++;
      }
    }
    setResult({ success, failed, total: preview.total });
    setImporting(false);
    if (onComplete) onComplete({ success, failed });
  };

  const downloadTemplate = () => {
    const csv = "title,type,amount,quantity,unit,rate,category,brand,supplier,date,notes,floor,phase,activity\n" +
      "Cement Purchase,Materials,45000,100,bag,450,Cement,ACC,Supplier A,2024-01-15,First delivery,Ground Floor,Foundation,Excavation\n" +
      "Mason wages,Wages,8000,8,day,1000,Labour,,,,2024-01-15,Daily wage,Ground Floor,Foundation,Excavation\n" +
      "JCB Rental,Expense,12000,2,day,6000,Equipment,JCB,rental company,2024-01-15,2 day rental";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "buildtrack_entry_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e5e5", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>CSV Bulk Import</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Import multiple entries at once from a CSV file</div>
        </div>
        <button onClick={downloadTemplate}
          style={{ padding: "8px 14px", background: "#f3f4f6", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer" }}>
          📥 Download Template
        </button>
      </div>

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

      {preview && !result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#555" }}>
              <strong>{preview.total}</strong> rows found
              {preview.detectedType && <span style={{ marginLeft: 8, padding: "2px 8px", background: "#eef2ff", color: "#3730a3", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Auto-detected: {preview.detectedType}</span>}
            </div>
            <button onClick={doImport} disabled={importing || !projectId}
              style={{
                padding: "8px 20px", background: importing ? "#f59561" : "#ea580c", color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: importing || !projectId ? "not-allowed" : "pointer",
              }}>
              {importing ? "Importing…" : `Import ${preview.total} Entries`}
            </button>
          </div>
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

      {result && (
        <div style={{ background: result.failed ? "#fef9c3" : "#dcfce7", border: `1px solid ${result.failed ? "#fde047" : "#86efac"}`, borderRadius: 10, padding: "14px 16px", fontSize: 13 }}>
          {result.failed ? "⚠️" : "✅"} Imported <strong>{result.success}</strong> of {result.total} entries
          {result.failed > 0 && <span style={{ color: "#991b1b" }}> ({result.failed} failed)</span>}
        </div>
      )}
    </div>
  );
}
