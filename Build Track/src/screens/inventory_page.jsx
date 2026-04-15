import { useState, useEffect, useCallback } from "react";
import { inventoryAPI } from "../api";
import { Toast } from "../components/Toast";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [usedQty, setUsedQty] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchInventory = useCallback(() => {
    setLoading(true);
    inventoryAPI.getAll()
      .then(({ data }) => setInventory(data.inventory || []))
      .catch(() => setToast({ msg: "Failed to load inventory", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleUseMaterial = async () => {
    if (!selectedMaterial || !usedQty || parseFloat(usedQty) <= 0) {
      setToast({ msg: "Please enter valid material and quantity", type: "error" });
      return;
    }

    try {
      setUpdating(true);
      await inventoryAPI.use({ materialName: selectedMaterial, usedQty: Number(usedQty) });
      setToast({ msg: "Inventory updated successfully!", type: "success" });
      setShowUseModal(false);
      setUsedQty("");
      fetchInventory();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed to update inventory", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Segoe UI', sans-serif" }}>
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "info" })} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>Material Inventory</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#666" }}>Track your stock levels automatically</p>
        </div>
        <button 
          onClick={() => setShowUseModal(true)}
          style={{
            padding: "10px 20px", background: "#ea580c", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(234,88,12,0.2)"
          }}
        >
          − Mark as Used
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.05em" }}>MATERIAL</th>
              <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.05em" }}>PURCHASED</th>
              <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.05em" }}>USED</th>
              <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.05em" }}>BALANCE STOCK</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading inventory...</td></tr>
            ) : inventory.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: 40, textAlign: "center", color: "#999" }}>No materials in stock yet.</td></tr>
            ) : inventory.map(item => (
              <tr key={item._id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ padding: "16px 20px", fontWeight: 600, color: "#1a1a1a" }}>
                  {item.materialName}
                  {item.unit && <span style={{ marginLeft: 8, fontSize: 11, color: "#999", fontWeight: 400 }}>({item.unit})</span>}
                </td>
                <td style={{ padding: "16px 20px", textAlign: "right", color: "#555" }}>{item.purchasedQty.toLocaleString()}</td>
                <td style={{ padding: "16px 20px", textAlign: "right", color: "#dc2626" }}>{item.usedQty.toLocaleString()}</td>
                <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: item.balanceQty > 0 ? "#16a34a" : "#dc2626" }}>
                  {item.balanceQty.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUseModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>Record Material Usage</h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>Select Material</label>
              <select 
                value={selectedMaterial} 
                onChange={e => setSelectedMaterial(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", outline: "none" }}
              >
                <option value="">Select a material</option>
                {inventory.map(i => <option key={i._id} value={i.materialName}>{i.materialName}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>Quantity Used</label>
              <input 
                type="number" 
                value={usedQty} 
                onChange={e => setUsedQty(e.target.value)}
                placeholder="0.00"
                style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={handleUseMaterial}
                disabled={updating}
                style={{ flex: 1, padding: 14, background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
              >
                {updating ? "Saving..." : "Update Stock"}
              </button>
              <button 
                onClick={() => { setShowUseModal(false); setSelectedMaterial(""); setUsedQty(""); }}
                style={{ flex: 1, padding: 14, background: "#f5f5f5", color: "#555", border: "1px solid #ddd", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
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
