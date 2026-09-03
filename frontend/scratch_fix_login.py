import re

with open('C:/build-track/Build-Track/Build Track/src/pages/login_page.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the start of the form
content = content.replace('<form onSubmit={handleLogin}>', '<form onSubmit={handleLogin}>\n              {!showForgot && (\n                <>')

# The end of the form inputs is right before the forgot password link
# Wait, the forgot password link should still be visible? No, it should be moved inside the showForgot block.
