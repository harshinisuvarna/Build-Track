import sys

file_path = 'C:/build-track/Build-Track/Build Track/src/api/index.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('api.get(/esign/status/)', 'api.get(`/esign/status/${reqId}`)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
