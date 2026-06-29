require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  try {
    console.log("Loading key...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No GEMINI_API_KEY found in environment!");
        return;
    }
    console.log(`Loaded Key (first 6): ${key.substring(0, 6)}`);
    console.log(`Loaded Key (last 6): ${key.substring(key.length - 6)}`);

    const genAI = new GoogleGenerativeAI(key);
    // Testing with gemini-flash-latest since that's what we configured
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log(`Testing model: ${model.model}`);
    const result = await model.generateContent("Say hello");
    console.log("Response:", result.response.text());

  } catch (error) {
    console.error("Error generating content:", error);
  }
}

testKey();
