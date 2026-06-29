require('dotenv').config();
const axios = require('axios');

async function testRestApi() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY is missing from environment.");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  
  const body = {
    "contents": [
      {
        "parts": [
          {
            "text": "Reply with exactly the word SUCCESS."
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    console.log("Full JSON Response:");
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log(`HTTP Status: ${error.response.status} ${error.response.statusText}`);
      console.log("Full JSON Response:");
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Request failed:", error.message);
    }
  }
}

testRestApi();
