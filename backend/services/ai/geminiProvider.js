const axios = require("axios");
const AIProvider = require("./aiProvider");
const aiDebugLogger = require("../../utils/aiDebugLogger");

class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.modelName = "gemini-2.5-flash";
    
    if (this.apiKey.length >= 12) {
      console.log(`Loaded GEMINI_API_KEY: ${this.apiKey.substring(0, 6)}...${this.apiKey.substring(this.apiKey.length - 6)}`);
    } else {
      console.log(`Loaded GEMINI_API_KEY: [KEY TOO SHORT OR MISSING]`);
    }
  }

  async _callApi(prompt, generationConfig = {}, modelOverride = null) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    const modelToUse = modelOverride || this.modelName;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig
    };

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const response = await axios.post(url, body, {
          headers: { "Content-Type": "application/json" },
          timeout: 30000 
        });

        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) {
          throw new Error("No candidates returned from Gemini API");
        }

        const parts = candidates[0].content?.parts;
        if (!parts || parts.length === 0) {
          throw new Error("No parts returned from Gemini API");
        }

        return parts[0].text || "";
      } catch (error) {
        if (error.response && error.response.status === 429) {
          attempt++;
          if (attempt >= maxAttempts) {
            throw error; 
          }
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`[Gemini API] 429 Too Many Requests. Retrying in ${waitTime}ms (Attempt ${attempt}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Generates a structured JSON intent from a natural language query.
   */
  async generateIntent(query, context = {}, schema, reqId) {
    aiDebugLogger.logEnter("Gemini: Generate Intent", reqId);
    const startTime = Date.now();
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    const prompt = `
You are an expert intent parser for a construction management app called BuildTrack.
Extract the user's intent based on their query and the provided context.
Ensure your response is valid JSON that strictly follows the provided schema.

CRITICAL INSTRUCTION: If a field is unknown or not mentioned by the user, return JSON null. Never return the strings 'null', 'undefined', 'none', or similar placeholders.

User Query: "${query}"

Context (Available Projects, Previous Context, etc):
${JSON.stringify(context, null, 2)}

Respond ONLY with a raw JSON object. No markdown, no code fences, no explanation. 
Follow this exact structure: 
${JSON.stringify(schema, null, 2)}
    `;

    try {
      aiDebugLogger.logSection("GEMINI INPUT", {
        "Model name": this.modelName,
        Temperature: 0.1,
        "Full prompt": prompt,
        "Context object": context,
        "Response schema": schema
      }, reqId);

      const generationConfig = {
        responseMimeType: "application/json",
        temperature: 0.1, 
      };

      const responseText = await this._callApi(prompt, generationConfig, "gemini-2.5-flash");
      
      aiDebugLogger.logSection("RAW GEMINI RESPONSE", responseText, reqId);
      aiDebugLogger.logExit("Gemini: Generate Intent", reqId);
      return JSON.parse(responseText);
    } catch (error) {
      aiDebugLogger.logError("Gemini: Generate Intent", error, reqId, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Generates a concise executive summary based on analytics data.
   */
  async generateSummary(analyticsData, userQuery, reqId) {
    aiDebugLogger.logEnter("Gemini: Generate Summary", reqId);
    const startTime = Date.now();
    if (!this.apiKey) {
       return "API key missing. Unable to generate summary.";
    }

    const prompt = `
You are a senior construction manager reporting to the project owner.
Provide a factual, 2-sentence executive summary based ONLY on the following analytics data.
Do not invent any numbers, trends, or facts. Do not mention that this is based on JSON data.
Keep it professional, concise, and directly address the user's original query if applicable.

User Query: "${userQuery}"

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}
    `;

    try {
      const generationConfig = {
        temperature: 0.3, 
      };

      const responseText = await this._callApi(prompt, generationConfig);
      aiDebugLogger.logExit("Gemini: Generate Summary", reqId);
      return responseText.trim();
    } catch (error) {
      aiDebugLogger.logError("Gemini: Generate Summary", error, reqId, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Generates follow-up suggestions based on the current context.
   */
  async generateFollowups(currentContext, reqId) {
    aiDebugLogger.logEnter("Gemini: Generate Followups", reqId);
    const startTime = Date.now();
    if (!this.apiKey) {
       return ["Export CSV"];
    }

    const prompt = `
Based on the current report context, suggest 3 short follow-up questions or actions the user might take next.
Return ONLY a JSON array of strings. No markdown formatting.
Keep suggestions under 5 words.

Context:
${JSON.stringify(currentContext, null, 2)}
    `;

    try {
      const generationConfig = {
        responseMimeType: "application/json",
        temperature: 0.5,
      };

      const responseText = await this._callApi(prompt, generationConfig);
      aiDebugLogger.logExit("Gemini: Generate Followups", reqId);
      const data = JSON.parse(responseText);
      return data.followUps || (Array.isArray(data) ? data.slice(0, 3) : ["Export CSV"]);
    } catch (error) {
      aiDebugLogger.logError("Gemini: Generate Followups", error, reqId, Date.now() - startTime);
      throw error;
    }
  }
}

module.exports = new GeminiProvider();
