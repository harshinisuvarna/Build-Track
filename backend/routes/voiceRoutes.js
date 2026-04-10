// backend/routes/voiceRoutes.js
const express = require("express");
const router  = express.Router();

// ── Levenshtein edit distance ─────────────────────────────────────────────────
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ── Consonant skeleton — strips vowels for phonetic-ish comparison ────────────
function consonants(s) {
  return s.toLowerCase().replace(/[aeiou\s]/g, "");
}

// ── Similarity score (0–1) using edit distance ────────────────────────────────
function similarity(a, b) {
  const la = a.toLowerCase(), lb = b.toLowerCase();
  const maxLen = Math.max(la.length, lb.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(la, lb) / maxLen;
}

// ── MAIN: fuzzy match input against a list ────────────────────────────────────
// Uses 7 progressively looser strategies to maximise voice-input matching
function fuzzyMatch(input, list) {
  if (!input || !list || list.length === 0) return null;
  const lower = input.toLowerCase().trim();
  if (!lower || lower.length < 2) return null;

  // 1. Exact match
  const exact = list.find(item => item.toLowerCase() === lower);
  if (exact) return exact;

  // 2. List item is substring of input
  const contained = list.find(item => lower.includes(item.toLowerCase()));
  if (contained) return contained;

  // 3. Input is substring of list item
  const sub = list.find(item => item.toLowerCase().includes(lower));
  if (sub) return sub;

  // 4. Token overlap — any word > 2 chars matches
  const inputTokens = lower.split(/\s+/);
  const tokenMatch = list.find(item => {
    const itemTokens = item.toLowerCase().split(/\s+/);
    return inputTokens.some(t => t.length > 2 && itemTokens.includes(t));
  });
  if (tokenMatch) return tokenMatch;

  // 5. Prefix match — first 3+ chars match
  if (lower.length >= 3) {
    const prefix3 = lower.slice(0, 3);
    const prefixMatch = list.find(item => item.toLowerCase().startsWith(prefix3));
    if (prefixMatch) return prefixMatch;
  }

  // 6. Consonant skeleton — ignore vowels
  const inputCons = consonants(lower);
  if (inputCons.length >= 2) {
    const consMatch = list.find(item => {
      const itemCons = consonants(item);
      // skeleton exact or within 1 edit
      return itemCons === inputCons || editDistance(inputCons, itemCons) <= 1;
    });
    if (consMatch) return consMatch;
  }

  // 7. Edit distance — allow ~35% difference (scales with name length)
  let bestMatch = null, bestSim = 0;
  const threshold = 0.55; // minimum 55% similarity
  for (const item of list) {
    // Compare full names
    const sim = similarity(lower, item.toLowerCase());
    if (sim > bestSim && sim >= threshold) {
      bestSim = sim;
      bestMatch = item;
    }
    // Also compare against each token in the list item
    const itemTokens = item.toLowerCase().split(/\s+/);
    for (const tok of itemTokens) {
      if (tok.length < 3) continue;
      const tokSim = similarity(lower, tok);
      if (tokSim > bestSim && tokSim >= threshold) {
        bestSim = tokSim;
        bestMatch = item;
      }
    }
  }
  return bestMatch;
}

// ── Best worker match: tries EVERY transcript word against the worker list ────
function bestWorkerMatch(transcript, workers) {
  if (!workers || workers.length === 0) return null;
  // Split transcript into words, try each against the worker list
  const tokens = transcript.toLowerCase().split(/\s+/).filter(t => t.length >= 3);
  // Noise words that should never be matched as a worker name
  const noise = new Set([
    "the", "for", "has", "have", "been", "was", "were", "and", "with",
    "from", "this", "that", "project", "wages", "wage", "paid", "pay",
    "given", "income", "expense", "material", "materials", "rupees",
    "lakh", "lakhs", "lacs", "lac", "crore", "crores", "thousand",
    "credited", "debited", "construction", "payment",
  ]);

  let best = null, bestSim = 0;
  const isDev = process.env.NODE_ENV !== "production";
  for (const token of tokens) {
    if (noise.has(token)) continue;
    for (const w of workers) {
      const wLower = w.toLowerCase();
      const wTokens = wLower.split(/\s+/);

      // Check token against full name and each name-part
      const candidates = [wLower, ...wTokens];
      for (const candidate of candidates) {
        if (candidate.length < 3) continue;
        const sim = similarity(token, candidate);
        if (isDev && sim > 0.4) console.log(`[bestWorkerMatch] "${token}" vs "${candidate}" = ${sim.toFixed(2)}`);
        if (sim > bestSim && sim >= 0.55) {
          bestSim = sim;
          best = w;
        }
      }
    }
  }
  if (isDev) console.log(`[bestWorkerMatch] result: ${best} (sim: ${bestSim.toFixed(2)})`);
  return best;
}

function detectCategory(transcript) {
  const t = transcript;

  // Check Wages first — more specific than Income
  if (/\b(pay|paid|wage|wages|salary|labour|labor|gave|given|giving|give|ways)\b/i.test(t)) {
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
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log("[localFallback] transcript :", t);
    console.log("[localFallback] workers    :", workers);
    console.log("[localFallback] projects   :", projects);
  }

  // ── Amount ──────────────────────────────────────────────────────────────────
  // Priority: lakh > crore > thousand > plain number
  // Handles: "6 lacs", "Rs 6 lacs", "rupees 6 lakh", "6.5 lakh", "6lacs"
  let amount = 0;
  const lakhMatch     = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i)
                     || t.match(/(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const croreMatch    = t.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)/i)
                     || t.match(/(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)/i);
  const thousandMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/i)
                     || t.match(/(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/i);
  const plainMatch    = t.match(/\d[\d,]*/);

  if      (lakhMatch)     amount = Math.round(parseFloat(lakhMatch[1] || lakhMatch[2])     * 100_000);
  else if (croreMatch)    amount = Math.round(parseFloat(croreMatch[1] || croreMatch[2])    * 10_000_000);
  else if (thousandMatch) amount = Math.round(parseFloat(thousandMatch[1] || thousandMatch[2]) * 1_000);
  else if (plainMatch)    amount = Number(plainMatch[0].replace(/,/g, ""));

  // ── Category ─────────────────────────────────────────────────────────────────
  // Delegated to detectCategory() which uses safe if/else-if logic
  const category = detectCategory(t);

  // ── Worker ──────────────────────────────────────────────────────────────────
  let worker = null;

  // Strategy A1: name immediately follows pay/paid/gave/given/give/got keywords
  const afterPayMatch = t.match(/\b(?:pay(?:ing)?|paid|gave|given|give|giving|got)\s+(?:to\s+)?(?:wages?\s+(?:of\s+)?)?([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (afterPayMatch) {
    worker = fuzzyMatch(afterPayMatch[1].trim(), workers);
    if (!worker) {
      const firstName = afterPayMatch[1].trim().split(/\s+/)[0];
      worker = fuzzyMatch(firstName, workers);
    }
  }

  // Strategy A2: name BEFORE keyword — "Sumitra got wages", "Suresh paid 500"
  if (!worker) {
    const beforePayMatch = t.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:got|paid|received|gave|given|gets?)\b/i);
    if (beforePayMatch) {
      worker = fuzzyMatch(beforePayMatch[1].trim(), workers);
      if (!worker) {
        const firstName = beforePayMatch[1].trim().split(/\s+/)[0];
        worker = fuzzyMatch(firstName, workers);
      }
    }
  }

  // Strategy B: full transcript scan — tries every word with similarity scoring
  // Handles spelling mistakes, pronunciation differences (e.g. Sumitra → sumithra)
  if (!worker && workers.length > 0) {
    worker = bestWorkerMatch(t, workers);
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

    if (isDev) console.log("[localFallback] afterFor raw:", raw, "→ cleaned:", cleaned);

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
  if (isDev) console.log("[localFallback] result →", result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE GEMINI RESULT
// Ensures Gemini's output only uses known workers/projects, and applies
// the same safe category detection used by localFallback.
// ─────────────────────────────────────────────────────────────────────────────
function validateGeminiResult(parsed, transcript, workers, projects) {
  const allowedCategories = ["Wages", "Expense", "Income", "Materials"];
  const isDev = process.env.NODE_ENV !== "production";
  if (!parsed || typeof parsed !== "object") return { valid: false };

  // Validate category against allow-list; fall back to Expense
  const category = allowedCategories.find(
    c => c.toLowerCase() === String(parsed.category || "").toLowerCase()
  ) || "Expense";

  // Validate worker against known list
  let worker = null;
  if (parsed.worker) {
    worker = workers.length > 0 ? fuzzyMatch(parsed.worker, workers) : parsed.worker;
    if (!worker && isDev) console.warn(`[Gemini] worker "${parsed.worker}" not in list — discarded`);
  }

  // Validate project against known list
  let project = null;
  if (parsed.project) {
    project = projects.length > 0 ? fuzzyMatch(parsed.project, projects) : parsed.project;
    if (!project && isDev) console.warn(`[Gemini] project "${parsed.project}" not in list — discarded`);
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
const isDev = process.env.NODE_ENV !== "production";
let genAI = null;
try {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim() && key !== "your_key_here") {
    genAI = new GoogleGenerativeAI(key.trim());
    if (isDev) console.log("✅ Gemini client ready");
  } else {
    if (isDev) console.warn("⚠️  GEMINI_API_KEY missing or placeholder — Gemini disabled");
  }
} catch (e) {
  if (isDev) console.warn("⚠️  @google/generative-ai SDK missing:", e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/voice/parse
// Main endpoint: tries Gemini first, falls back to local parser on any failure.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/parse", async (req, res) => {
  try {
    const { transcript, workers = [], projects = [] } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    const t = transcript.trim();

    if (isDev) {
      console.log("\n══════════════════════════════════════════════");
      console.log("[voice/parse] transcript :", t);
      console.log("[voice/parse] workers    :", workers.length, workers);
      console.log("[voice/parse] projects   :", projects.length, projects);
      console.log("══════════════════════════════════════════════");
    }

    // ── TRY GEMINI ───────────────────────────────────────────────────────────
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

        if (isDev) console.log("[Gemini] Sending prompt…");

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
        if (isDev) console.log("[Gemini] raw response:", text);

        // Parse JSON — try direct parse first, then regex extraction
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*?\}/);
          if (!match) throw new Error("No JSON in Gemini response");
          parsed = JSON.parse(match[0]);
        }

        if (isDev) console.log("[Gemini] parsed:", parsed);

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

        if (isDev) console.log("[Gemini] final:", { worker, project, amount, category });
        return res.json({ worker, project, amount, category, notes, source: "gemini" });

      } catch (geminiErr) {
        if (isDev) console.warn("[Gemini] FAILED →", geminiErr.message, "— using local fallback");
      }
    } else {
      if (isDev) console.log("[voice/parse] Gemini disabled — using local fallback directly");
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