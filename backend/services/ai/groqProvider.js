const axios = require("axios");
const AIProvider = require("./aiProvider");
const aiDebugLogger = require("../../utils/aiDebugLogger");

// ─────────────────────────────────────────────────────────────────────────────
// GroqAuthError — Thrown on 401/403 so callers can distinguish auth failures
// ─────────────────────────────────────────────────────────────────────────────
class GroqAuthError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "GroqAuthError";
    this.statusCode = statusCode;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GroqProvider — Drop-in replacement for GeminiProvider
// Model: llama-3.3-70b-versatile (free tier: 14,400 req/day, 6000 req/min)
// Switch: set GROQ_API_KEY in your .env file
// ─────────────────────────────────────────────────────────────────────────────

class GroqProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.modelName = "llama-3.3-70b-versatile";
    this.baseUrl = "https://api.groq.com/openai/v1/chat/completions";

    if (this.apiKey.length >= 12) {
      console.log(`[GroqProvider] Loaded GROQ_API_KEY: ${this.apiKey.substring(0, 6)}...${this.apiKey.substring(this.apiKey.length - 6)}`);
      console.log(`[GroqProvider] Model: ${this.modelName}`);
    } else {
      console.log(`[GroqProvider] GROQ_API_KEY is missing or too short.`);
    }
  }

  // ─── Core API call with exponential backoff on 429 ────────────────────────
  async _callApi(systemPrompt, userPrompt, temperature = 0.1, expectJson = false) {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is missing");
    }

    const body = {
      model: this.modelName,
      temperature,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   }
      ],
      ...(expectJson && { response_format: { type: "json_object" } })
    };

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const response = await axios.post(this.baseUrl, body, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          timeout: 30000
        });

        const choice = response.data.choices?.[0];
        if (!choice) throw new Error("No choices returned from Groq API");

        return choice.message?.content?.trim() || "";

      } catch (error) {
        if (error.response?.status === 429) {
          attempt++;
          if (attempt >= maxAttempts) throw error;
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.warn(`[GroqProvider] 429 rate limit hit. Retrying in ${waitTime}ms (attempt ${attempt}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          // ── Auth failure — throw a typed error the route can catch ──
          const code = error.response.status;
          console.error(`[GroqProvider] ${code} Auth Error — API key invalid or revoked`);
          if (error.response?.data) {
            console.error("[GroqProvider] Error body:", JSON.stringify(error.response.data));
          }
          throw new GroqAuthError(
            "The Groq API key is invalid or expired. Please update the API key in the Render environment variables.",
            code
          );
        } else {
          // Log the actual error body for easier debugging
          if (error.response?.data) {
            console.error("[GroqProvider] API Error:", JSON.stringify(error.response.data));
          }
          throw error;
        }
      }
    }
  }

  // ─── Strip markdown/code fences from JSON responses ──────────────────────
  _cleanJson(text) {
    return text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }

  // ─── 1. generateIntent ────────────────────────────────────────────────────
  async generateIntent(query, context = {}, schema, reqId) {
    aiDebugLogger.logEnter("Groq: Generate Intent", reqId);
    const startTime = Date.now();

    if (!this.apiKey) throw new Error("GROQ_API_KEY is missing");

    const systemPrompt = `
You are an expert intent parser for a construction management app called BuildTrack.
Your ONLY job is to extract the user's intent and return a raw JSON object.

RULES:
- Return ONLY a valid JSON object. No markdown, no code fences, no explanation.
- If a field is unknown or not mentioned, set it to JSON null.
- Never use the strings "null", "undefined", or "none" as values.
- Dates: resolve relative dates like "this month", "last week" to actual ISO date ranges based on today's date (${new Date().toISOString().split("T")[0]}).
- If the user mentions multiple project names (e.g. 'Bajpe Towers and Skyline'), return project as a comma-separated string like 'Bajpe Towers, Skyline'. Never combine them into one word.
- Follow the schema structure EXACTLY.

Schema to follow:
${JSON.stringify(schema, null, 2)}
    `.trim();

    const userPrompt = `
User Query: "${query}"

Available Context:
${JSON.stringify(context, null, 2)}
    `.trim();

    try {
      aiDebugLogger.logSection("GROQ INPUT", {
        "Model": this.modelName,
        "Temperature": 0.1,
        "System prompt": systemPrompt,
        "User prompt": userPrompt,
        "Context": context,
        "Schema": schema
      }, reqId);

      const responseText = await this._callApi(systemPrompt, userPrompt, 0.1, true);
      const cleaned = this._cleanJson(responseText);

      aiDebugLogger.logSection("RAW GROQ RESPONSE", cleaned, reqId);
      aiDebugLogger.logExit("Groq: Generate Intent", reqId);

      return JSON.parse(cleaned);
    } catch (error) {
      aiDebugLogger.logError("Groq: Generate Intent", error, reqId, Date.now() - startTime);
      throw error;
    }
  }

  // ─── 2. generateSummary ───────────────────────────────────────────────────
  async generateSummary(analyticsData, userQuery, reqId) {
    aiDebugLogger.logEnter("Groq: Generate Summary", reqId);
    const startTime = Date.now();

    if (!this.apiKey) return "API key missing. Unable to generate summary.";

    let systemPrompt = `
You are a senior construction analyst. Analyze the data and do ALL of:
1. State the key metric (total cost, quantity, or count)
2. Identify the single biggest outlier or anomaly in the data (highest cost item, most used material, largest project spend)
3. Give one actionable recommendation based on the numbers.
Keep it to 3 sentences max. Never invent numbers not in the data.
    `.trim();

    if (analyticsData && analyticsData.comparisonData) {
       systemPrompt += `\n\nCompare the two items and state which one has higher usage and cost. Mention if one is significantly more expensive per unit.`;
    }

    const userPrompt = `
User Query: "${userQuery}"

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}
    `.trim();

    try {
      const responseText = await this._callApi(systemPrompt, userPrompt, 0.3, false);
      aiDebugLogger.logExit("Groq: Generate Summary", reqId);
      return responseText;
    } catch (error) {
      aiDebugLogger.logError("Groq: Generate Summary", error, reqId, Date.now() - startTime);
      throw error;
    }
  }

  // ─── 3. generateFollowups ─────────────────────────────────────────────────
  async generateFollowups(currentContext, reqId) {
    aiDebugLogger.logEnter("Groq: Generate Followups", reqId);
    const startTime = Date.now();

    if (!this.apiKey) return ["Export CSV"];

    const systemPrompt = `
You are a helpful assistant for a construction management app.
Suggest 3 short follow-up questions or actions the user might want next.
Return ONLY a JSON array of 3 strings. No markdown, no explanation.
Each suggestion must be under 6 words.
Example output: ["Show labour costs", "Filter by project", "Export to CSV"]
    `.trim();

    const userPrompt = `
Current report context:
${JSON.stringify(currentContext, null, 2)}
    `.trim();

    try {
      const responseText = await this._callApi(systemPrompt, userPrompt, 0.5, true);
      const cleaned = this._cleanJson(responseText);

      aiDebugLogger.logExit("Groq: Generate Followups", reqId);

      const data = JSON.parse(cleaned);

      // Handle both array and object responses gracefully
      if (Array.isArray(data)) return data.slice(0, 3);
      if (data.followUps && Array.isArray(data.followUps)) return data.followUps.slice(0, 3);
      if (data.suggestions && Array.isArray(data.suggestions)) return data.suggestions.slice(0, 3);

      return ["Export CSV", "Filter by project", "Show summary"];
    } catch (error) {
      aiDebugLogger.logError("Groq: Generate Followups", error, reqId, Date.now() - startTime);
      return ["Export CSV", "Filter by project", "Show summary"]; // Safe fallback
    }
  }
}

const groqProviderInstance = new GroqProvider();
module.exports = groqProviderInstance;
module.exports.GroqAuthError = GroqAuthError;