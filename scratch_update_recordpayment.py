import sys
import re

file_path = 'C:/build-track/Build-Track/Build Track/src/components/RecordPaymentSheet.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

ui_block = '''          {selectedMethod === "Cash" && (
            <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, border: "1px solid #E2E4F6", background: "#F8F9FF" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: requestEsign ? 12 : 0 }}>
                <input
                  type="checkbox"
                  checked={requestEsign}
                  onChange={(e) => setRequestEsign(e.target.checked)}
                  disabled={esignPolling || esignCompleted}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1E1E2E" }}>Request E-Signature for Cash Receipt</span>
              </label>

              {requestEsign && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="email"
                    placeholder="Client Email Address"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    disabled={esignPolling || esignCompleted}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #CCCFE8", outline: "none", fontSize: 13, fontFamily: "inherit" }}
                  />
                  {!esignCompleted && (
                    <button
                      onClick={esignPolling ? () => setEsignPolling(false) : startEsignFlow}
                      style={{
                        padding: "10px", borderRadius: 8, border: "none",
                        background: esignPolling ? "#FEE2E2" : "#173EEA",
                        color: esignPolling ? "#DC2626" : "#FFF",
                        fontWeight: 700, fontSize: 12, cursor: "pointer",
                        fontFamily: "inherit"
                      }}
                    >
                      {esignPolling ? "Cancel Request" : "Send Request"}
                    </button>
                  )}
                  {(esignStatusText || esignCompleted) && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: esignCompleted ? "#15803D" : "#B45309", display: "flex", alignItems: "center", gap: 6 }}>
                       {esignCompleted ? <CheckCircle size={14} /> : (esignPolling && <div className="spinner-spin" style={{ width: 10, height: 10, border: "2px solid #B45309", borderTopColor: "transparent", borderRadius: "50%" }}/>)}
                       {esignStatusText}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}'''

target = 'ACTUAL AMOUNT PAID'
if ui_block not in content:
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if target in line:
            # We want to insert ui_block BEFORE this div. The target is inside a div, so insert before the previous line
            # Wait, the previous line is <div style={{ fontSize: 10...
            lines.insert(i-1, ui_block)
            break
    content = '\n'.join(lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
