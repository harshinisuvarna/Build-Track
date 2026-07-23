require('dotenv').config();
const axios = require('axios');

async function checkKey() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error("GEMINI_API_KEY is missing from environment.");
      return;
    }

    console.log(`Loaded Key (first 6): ${key.substring(0, 6)}`);
    console.log(`Loaded Key (last 6): ${key.substring(key.length - 6)}`);
    console.log("-------------------------------------------------");

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log(`Calling: https://generativelanguage.googleapis.com/v1beta/models`);

    const response = await axios.get(url);

    console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);
    console.log("Response Body (first 500 chars):");
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + "...\n(truncated)");

  } catch (error) {
    if (error.response) {
      console.log(`\nHTTP Status: ${error.response.status} ${error.response.statusText}`);
      console.log("Response Body:");
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Request failed without response:", error.message);
    }
  }
}

checkKey();
