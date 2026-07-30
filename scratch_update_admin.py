import sys
import re

file_path = 'C:/build-track/Build-Track/Build Track/src/screens/dashboards/AdminDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
if 'const [lang, setLang] = useState' not in content:
    content = content.replace('const [loading, setLoading] = useState', 'const [lang, setLang] = useState("en");\n  const [loading, setLoading] = useState')

# Replace the broken lang lines
pattern = re.compile(r"\{ label: lang === 'kn' \? '[^']+' : lang === 'ta' \? '[^']+' : 'Total Revenue', value: formatCurrency\(totalRevenue\), subtitle: lang === 'kn' \? '[^']+' : lang === 'ta' \? '[^']+' : 'Cash Inflow', icon: ArrowUpRight, color: '#22C55E' \},")
replacement = "{ label: lang === 'kn' ? 'Ottu Aadaaya' : lang === 'ta' ? 'Motha Varuvai' : 'Total Revenue', value: formatCurrency(totalRevenue), subtitle: lang === 'kn' ? 'Nagadu O?aharivu' : lang === 'ta' ? 'Pana Varavu' : 'Cash Inflow', icon: ArrowUpRight, color: '#22C55E' },"
content = pattern.sub(replacement, content)

# Add toggle to Revenue Inflow Timeline
old_timeline_header = '''<div style={{ padding: '20px 24px', borderBottom: 1px solid  }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Revenue Inflow Timeline
            </div>
          </div>'''

new_timeline_header = '''<div style={{ padding: '20px 24px', borderBottom: 1px solid , display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {lang === 'kn' ? 'Aadaaya Inflow Timeline' : lang === 'ta' ? 'Varuvai Inflow Timeline' : 'Revenue Inflow Timeline'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['en', 'kn', 'ta'].map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    padding: '4px 8px', borderRadius: 4, border: 'none',
                    background: lang === l ? colors.primary : '#E5E7EB',
                    color: lang === l ? '#FFF' : '#374151',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>'''
content = content.replace(old_timeline_header, new_timeline_header)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
