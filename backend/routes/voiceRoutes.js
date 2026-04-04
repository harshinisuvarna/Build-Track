// backend/routes/voiceRoutes.js
const express = require("express");
const router  = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY MATCH
// Tries to match a raw string against a known list using 4 progressively
// looser strategies: exact → contained-in-input → input-in-item → token overlap
// ─────────────────────────────────────────────────────────────────────────────
function fuzzyMatch(input, list) {
  if (!input || !list || list.length === 0) return null;
  const lower = input.toLowerCase().trim();
  if (!lower) return null;

  // 1. Exact match (case-insensitive)
  const exact = list.find(item => item.toLowerCase() === lower);
  if (exact) return exact;

  // 2. List item is a substring of input  ("hotel" ∈ "the project hotel")
  const contained = list.find(item => lower.includes(item.toLowerCase()));
  if (contained) return contained;

  // 3. Input is a substring of list item  ("suresh" ∈ "Suresh - Masonry")
  const sub = list.find(item => item.toLowerCase().includes(lower));
  if (sub) return sub;

  // 4. Token overlap — any word from input > 2 chars matches a word in item
  const inputTokens = lower.split(/\s+/);
  const tokenMatch  = list.find(item => {
    const itemTokens = item.toLowerCase().split(/\s+/);
    return inputTokens.some(t => t.length > 2 && itemTokens.includes(t));
  });
  return tokenMatch || null;
}

function detectCategory(transcript) {
  const t = transcript;

  // Check Wages first — more specific than Income
  if (/\b(pay|paid|wage|wages|salary|labour|labor|gave|ways)\b/i.test(t)) {
    return "Wages";
  }

  // Materials — purchasing / buying physical items
  if (/\b(cement|steel|sand|brick|material|materials|paint|bought|buy|purchase)\b/i.test(t)) {
    return "Materials";
  }

  // Income — only unambiguous payment-received phrases
  // NOTE: "got\s+the" removed; it matched too broadly (e.g. "got the wages")
  if (/\b(received|income|client|got\s+payment|payment\s+received)\b/i.test(t)) {
    return "Income";
  }

  // Default fallback
  return "Expense";
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL FALLBACK PARSER
// Used when Gemini is unavailable or times out.
// Extracts: amount, category, worker, project from raw transcript text.
// ─────────────────────────────────────────────────────────────────────────────
function localFallback(transcript, workers = [], projects = []) {
  const t = transcript.trim();
  console.log("[localFallback] transcript :", t);
  console.log("[localFallback] workers    :", workers);
  console.log("[localFallback] projects   :", projects);

  // ── Amount ──────────────────────────────────────────────────────────────────
  // Priority: lakh > crore > thousand > plain number
  let amount = 0;
  const lakhMatch     = t.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  const croreMatch    = t.match(/(\d+(?:\.\d+)?)\s*crore/i);
  const thousandMatch = t.match(/(\d+(?:\.\d+)?)\s*thousand/i);
  const plainMatch    = t.match(/\d[\d,]*/);

  if      (lakhMatch)     amount = Math.round(parseFloat(lakhMatch[1])     * 100_000);
  else if (croreMatch)    amount = Math.round(parseFloat(croreMatch[1])    * 10_000_000);
  else if (thousandMatch) amount = Math.round(parseFloat(thousandMatch[1]) * 1_000);
  else if (plainMatch)    amount = Number(plainMatch[0].replace(/,/g, ""));

  // ── Category ─────────────────────────────────────────────────────────────────
  // Delegated to detectCategory() which uses safe if/else-if logic
  const category = detectCategory(t);

  // ── Worker ──────────────────────────────────────────────────────────────────
  let worker = null;

  // Strategy A: name immediately follows pay/paid/gave keywords
  const afterPayMatch = t.match(/\b(?:pay(?:ing)?|paid|gave)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (afterPayMatch) {
    worker = fuzzyMatch(afterPayMatch[1].trim(), workers);
    if (!worker) {
      // Try just the first word (handles "paid Suresh Kumar 500")
      const firstName = afterPayMatch[1].trim().split(/\s+/)[0];
      worker = fuzzyMatch(firstName, workers);
    }
  }

  // Strategy B: scan entire transcript for any known worker name
  if (!worker && workers.length > 0) {
    for (const w of workers) {
      const wTokens = w.toLowerCase().split(/\s+/);
      const tTokens = t.toLowerCase().split(/\s+/);
      const hit = wTokens.some(wt => wt.length > 2 && tTokens.includes(wt));
      if (hit) { worker = w; break; }
    }
  }

  // ── Project ─────────────────────────────────────────────────────────────────
  let project = null;

  // Strategy A: extract phrase after "for", strip common noise words
  const afterForMatch = t.match(/\bfor\s+([A-Za-z][A-Za-z\s\d\-]*)/i);
  if (afterForMatch) {
    const raw     = afterForMatch[1].trim();
    const cleaned = raw
      .replace(/^(the\s+|project\s+|work\s+|site\s+|this\s+)+/i, "")
      .trim();

    console.log("[localFallback] afterFor raw:", raw, "→ cleaned:", cleaned);

    project = fuzzyMatch(cleaned, projects);
    if (!project) project = fuzzyMatch(raw, projects);

    // Progressively shorten phrase if full match fails
    if (!project) {
      const words = cleaned.split(/\s+/);
      for (let len = words.length - 1; len >= 1 && !project; len--) {
        project = fuzzyMatch(words.slice(0, len).join(" "), projects);
      }
    }
  }

  // Strategy B: scan entire transcript for any known project name
  if (!project && projects.length > 0) {
    for (const p of projects) {
      const pTokens = p.toLowerCase().split(/\s+/);
      const tTokens = t.toLowerCase().split(/\s+/);
      const hit = pTokens.some(pt => pt.length > 2 && tTokens.includes(pt));
      if (hit) { project = p; break; }
    }
  }

  const result = { worker, project, amount, category, notes: transcript, source: "local" };
  console.log("[localFallback] result →", result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE GEMINI RESULT
// Ensures Gemini's output only uses known workers/projects, and applies
// the same safe category detection used by localFallback.
// ─────────────────────────────────────────────────────────────────────────────
function validateGeminiResult(parsed, transcript, workers, projects) {
  const allowedCategories = ["Wages", "Expense", "Income", "Materials"];
  if (!parsed || typeof parsed !== "object") return { valid: false };

  // Validate category against allow-list; fall back to Expense
  const category = allowedCategories.find(
    c => c.toLowerCase() === String(parsed.category || "").toLowerCase()
  ) || "Expense";

  // Validate worker against known list
  let worker = null;
  if (parsed.worker) {
    worker = workers.length > 0 ? fuzzyMatch(parsed.worker, workers) : parsed.worker;
    if (!worker) console.warn(`[Gemini] worker "${parsed.worker}" not in list — discarded`);
  }

  // Validate project against known list
  let project = null;
  if (parsed.project) {
    project = projects.length > 0 ? fuzzyMatch(parsed.project, projects) : parsed.project;
    if (!project) console.warn(`[Gemini] project "${parsed.project}" not in list — discarded`);
  }

  return {
    valid: true,
    worker,
    project,
    amount:   Number(parsed.amount) || 0,
    category,
    notes:    parsed.notes || transcript,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI CLIENT — lazy initialisation
// Fails gracefully if SDK is missing or API key is not configured.
// ─────────────────────────────────────────────────────────────────────────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim() && key !== "your_key_here") {
    genAI = new GoogleGenerativeAI(key.trim());
    console.log("✅ Gemini client ready");
  } else {
    console.warn("⚠️  GEMINI_API_KEY missing or placeholder — Gemini disabled");
  }
} catch (e) {
  console.warn("⚠️  @google/generative-ai SDK missing:", e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/voice/parse
// Main endpoint: tries Gemini first, falls back to local parser on any failure.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/parse", async (req, res) => {
  try {
    const { transcript, workers = [], projects = [] } = req.body;

    console.log("\n══════════════════════════════════════════════");
    console.log("[voice/parse] transcript :", transcript);
    console.log("[voice/parse] workers    :", workers.length, workers);
    console.log("[voice/parse] projects   :", projects.length, projects);
    console.log("══════════════════════════════════════════════");

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    const t = transcript.trim();

    // ── TRY GEMINI ──────────────────────────────────────────────────────────
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const workerList  = workers.length  ? workers.join(", ")  : "(none provided)";
        const projectList = projects.length ? projects.join(", ") : "(none provided)";

        const prompt = `You are a smart construction site voice assistant for an Indian company called BuildTrack.

You are given a list of known workers and projects. Extract structured data from the spoken sentence.

Known workers:  ${workerList}
Known projects: ${projectList}

Sentence: "${t}"

RULES:
- Match worker ONLY from the Known workers list (case-insensitive, allow small spelling mistakes). Return null if no match.
- Match project ONLY from the Known projects list (case-insensitive, allow small spelling mistakes). Return null if no match.
- NEVER invent names or return placeholder values.
- Amount: plain number only, no symbols. Return 0 if missing.

CATEGORY — pick exactly one:
- "Wages"     → words: pay, paid, gave, wage, salary, labour
- "Materials" → words: cement, sand, steel, brick, paint, bought, buy
- "Income"    → words: received, got payment, income, client payment
- "Expense"   → everything else

Return ONLY raw JSON, no markdown:
{"worker":null,"project":null,"category":"Expense","amount":0,"notes":""}`;

        console.log("[Gemini] Sending prompt…");

        // Race against an 8-second timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout 8 s")), 8000)
          ),
        ]);

        // Strip any accidental markdown fences from the response
        let text = result.response.text().trim();
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        console.log("[Gemini] raw response:", text);

        // Parse JSON — try direct parse first, then regex extraction
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*?\}/);
          if (!match) throw new Error("No JSON in Gemini response");
          parsed = JSON.parse(match[0]);
        }

        console.log("[Gemini] parsed:", parsed);

        const validated = validateGeminiResult(parsed, t, workers, projects);
        if (!validated.valid) throw new Error("Gemini validation failed");

        let { worker, project, amount, category, notes } = validated;

        // Fill any nulls that Gemini missed with local fallback values
        if (!worker || !project || !amount) {
          const local = localFallback(t, workers, projects);
          if (!worker)  worker  = local.worker;
          if (!project) project = local.project;
          if (!amount)  amount  = local.amount;
        }

        console.log("[Gemini] final:", { worker, project, amount, category });
        return res.json({ worker, project, amount, category, notes, source: "gemini" });

      } catch (geminiErr) {
        console.warn("[Gemini] FAILED →", geminiErr.message, "— using local fallback");
      }
    } else {
      console.log("[voice/parse] Gemini disabled — using local fallback directly");
    }

    // ── LOCAL FALLBACK ───────────────────────────────────────────────────────
    const fallback = localFallback(t, workers, projects);
    return res.json(fallback);

  } catch (err) {
    console.error("[voice/parse] Unhandled error:", err);
    return res.status(500).json({ message: "Voice parse failed", error: err.message });
  }
});

module.exports = router;