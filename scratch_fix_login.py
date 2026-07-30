import sys

file_path = 'C:/build-track/Build-Track/Build Track/src/pages/login_page.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'Enter your recovery email and we will mail you a reset link.',
    'Enter your email to receive a reset link.'
)
content = content.replace(
    'label="Recovery Email"',
    'label="Email Address"'
)
content = content.replace(
    'Enter Token & New Password',
    'Enter Reset Token'
)
content = content.replace(
    'label=\'6-Digit Token\'',
    'label=\'Reset Token\''
)
content = content.replace(
    'label="6-Digit Token"',
    'label="Reset Token"'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
