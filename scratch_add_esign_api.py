import sys

file_path = 'C:/build-track/Build-Track/Build Track/src/api/index.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'export const esignAPI' not in content:
    content += '''\nexport const esignAPI = {
  requestSignature: (data) => api.post("/esign/request", data),
  checkStatus: (reqId) => api.get(/esign/status/)
};\n'''

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
