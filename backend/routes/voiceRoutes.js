const express = require("express");
const router  = express.Router();

// ── Local regex fallback (standalone fn so it is always available) ─────────
function localFallback(transcript) {
  const amountMatch = transcript.match(/\d[\d,]*/);
  const amount      = amountMatch ? Number(amountMatch[0].replace(/,/g, "")) : 0;

  let category = "Expense";
  if (/pay|wage|salary|labour/i.test(transcript))              category = "Wages";
  if (/cement|steel|sand|brick|material|paint/i.test(transcript)) category = "Materials";
  if (/client|received|income|payment\s+received/i.test(transcript)) category = "Income";

  const workerMatch = transcript.match(/pay(?:ing|ed)?\s+([a-zA-Z]+)/i);

  return {
    worker:   workerMatch ? workerMatch[1] : "",
    amount,
    category,
    notes:    transcript,
    source:   "local",
  };
}

// ── Safely try to load the Gemini SDK (won't crash if key is wrong) ────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_key_here") {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  console.warn("Gemini SDK could not be initialised:", e.message);
}

// ── POST /api/voice/parse ──────────────────────────────────────────────────
router.post("/parse", async (req, res) => {
  const { transcript } = req.body;

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ message: "Transcript is required" });
  }

  // If Gemini is available, try it first
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `You are a construction site finance assistant for an Indian company called BuildTrack.
Extract transaction details from this voice command: "${transcript}"

Return ONLY a valid JSON object — no markdown, no explanation, raw JSON only — with exactly these keys:
- worker   (string: person name or project label)
- amount   (number: numeric value only, e.g. 1200)
- category (string: one of Wages, Materials, Income, Expense)
- notes    (string: short description)`;

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 6000)
        ),
      ]);

      let text = result.response.text().trim();
      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON in Gemini response");
        parsed = JSON.parse(match[0]);
      }

      console.log("✅ Gemini parsed:", parsed);
      return res.json({ ...parsed, source: "gemini" });

    } catch (geminiErr) {
      console.warn("Gemini failed → local fallback:", geminiErr.message);
      // fall through to local fallback below
    }
  }

  // Local fallback — always returns valid JSON
  return res.json(localFallback(transcript));
});

module.exports = router;
