import sys
import re

file_path = 'C:/build-track/Build-Track/Build Track/src/pages/login_page.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make the token block unconditionally visible if they are in Forgot Password mode, or add a toggle.
# Let's add a toggle "Already have a token?" if !showReset

replacement = '''
                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    {!showReset && (
                      <span
                        onClick={() => setShowReset(true)}
                        style={{ fontSize: "12.5px", fontWeight: "700", color: "#4F46E5", cursor: "pointer" }}
                      >
                        Already have a token?
                      </span>
                    )}
                  </div>

                  {showReset && (
'''

content = content.replace('{showReset && (', replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
