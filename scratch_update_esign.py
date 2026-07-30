import sys
import re

file_path = 'C:/build-track/Build-Track/backend/routes/esignRoutes.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <select>
old_select = '''<select id="lang-select">
            <option value="en">English</option>
            <option value="kn">?????</option>
            <option value="ta">?????</option>
          </select>'''
new_select = '''<select id="lang-select">
            <option value="en">English</option>
            <option value="kn">Kannada</option>
            <option value="ta">Tamil</option>
          </select>'''
# The original might have weird characters due to encoding so let's just use regex
content = re.sub(r'<select id="lang-select">.*?</select>', new_select, content, flags=re.DOTALL)

# Replace i18n
new_i18n = '''const i18n = {
          en: {
            title: "CASH RECEIPT",
            btnAuth: "I Authorize & Sign",
            btnAuthWait: "Authorizing...",
            stampTitle: "Authorized and Signed",
            stampIp: "IP:",
            stampDate: "Date:",
            successTitle: "Receipt Authorized",
            successMsg: "Thank you! Your authorization has been securely recorded.",
            errNetwork: "Network error. Try again.",
            keys: {
              projectName: "Project Name", itemName: "Item Name", type: "Type", activityName: "Activity Name", phase: "Phase",
              totalAmount: "Total Amount", alreadyPaid: "Already Paid", amount: "Amount",
              paymentMethod: "Payment Method", notes: "Notes", date: "Date"
            }
          },
          kn: {
            title: "Nagadu Rasidi",
            btnAuth: "Naanu Angikarisuthene & Sahimaduthene",
            btnAuthWait: "Angikarisalaguttide...",
            stampTitle: "Angikarisalagide mattu sahimadalagide",
            stampIp: "IP:",
            stampDate: "Dinaanka:",
            successTitle: "Rasidi Angikarisalagide",
            successMsg: "Dhanyavadagalu! Nimmma angikaravannu surakshitavagi dakhale madalagide.",
            errNetwork: "Network dosha. Matte prayatnisi.",
            keys: {
              projectName: "Project Hesaru", itemName: "Item Hesaru", type: "Vidhagalu", activityName: "Activity Hesaru", phase: "Hantha",
              totalAmount: "Ottu Motta", alreadyPaid: "Eegagale Pavatislagide", amount: "Motta",
              paymentMethod: "Pavathi Vidhana", notes: "Tippanigalu", date: "Dinaanka"
            }
          },
          ta: {
            title: "Rokka Rasithu",
            btnAuth: "Naan Angikarikiren & Kaiyeluthidugiren",
            btnAuthWait: "Angikarikirathu...",
            stampTitle: "Angikarikkappattathu mariyum kaiyeluthidappattathu",
            stampIp: "IP:",
            stampDate: "Thethi:",
            successTitle: "Rasithu Angikarikkappattathu",
            successMsg: "Nandri! Ungal angikaram pathukappaga pathivu seyyappattullathu.",
            errNetwork: "Network pizhai. Meendum muyarchi seyyavum.",
            keys: {
              projectName: "Project Peyar", itemName: "Item Peyar", type: "Vagai", activityName: "Activity Peyar", phase: "Kattam",
              totalAmount: "Motha Thogai", alreadyPaid: "Earkanave Seluthappattathu", amount: "Thogai",
              paymentMethod: "Seluthum Murai", notes: "Kurippugal", date: "Thethi"
            }
          }
        };'''

content = re.sub(r'const i18n = \{.*?\n        \};', new_i18n, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
