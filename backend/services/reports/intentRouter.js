const deterministicCache = new Map();
const aiDebugLogger = require("../../utils/aiDebugLogger");

function parseDeterministic(query) {
  const lower = query.toLowerCase().trim();

  if (/(compare|vs\b|versus|difference between|which is better)/i.test(lower)) {
    return null;
  }

  if (lower === "show all materials" || lower === "all materials" || lower === "materials" || lower === "show material usage") {
    return {
      intent: "inventory_status",
      category: "material",
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (lower === "material transactions" || lower === "material purchases" || lower === "material history") {
    return {
      intent: "resource_report",
      category: "expense",
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (lower === "show everything" || lower === "show all" || lower === "show all inventory") {
    return {
      intent: "inventory_status",
      category: null,
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (lower === "show low stock materials" || lower === "low stock" || lower === "inventory status") {
    return {
      intent: "inventory_status",
      category: "material",
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (lower === "budget health" || lower === "budget") {
    return {
      intent: "budget_health",
      category: "all",
      period: null,
      project: "all",
      aggregation: "project_wise",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (lower === "pending payments" || lower === "pending") {
    return {
      intent: "pending_payments",
      category: "all",
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (/(show labour|show all labour|labour report|worker report|show workers|show manpower|show wages)/i.test(lower)) {
    return {
      intent: "inventory_status",
      category: "labour",
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  if (/(show equipment|show all equipment|equipment usage|machinery report|show machinery|show jcb)/i.test(lower)) {
    return {
      intent: "inventory_status",
      category: "equipment",
      period: null,
      project: "all",
      aggregation: "summary",
      confidenceScore: 1.0,
      isDeterministic: true
    };
  }

  return null;
}

async function routeIntent(query, context, aiProvider, schema, reqId) {
  aiDebugLogger.logEnter("Intent Router", reqId);
  const startTime = Date.now();

  try {

    const cacheKey = `${query}_${context?.projectId || 'all'}`;
    if (deterministicCache.has(cacheKey)) {
      const cached = deterministicCache.get(cacheKey);
      aiDebugLogger.logSection("INTENT ROUTER", {
        "Deterministic routing used": true,
        "Matched rule": cached.intent,
        "Why Gemini invoked": "N/A"
      }, reqId);
      aiDebugLogger.logExit("Intent Router", reqId);
      return cached;
    }

    const deterministicIntent = parseDeterministic(query);
    if (deterministicIntent) {

      if (deterministicCache.size < 500) {
         deterministicCache.set(cacheKey, deterministicIntent);
      }
      aiDebugLogger.logSection("INTENT ROUTER", {
        "Deterministic routing used": true,
        "Matched rule": deterministicIntent.intent,
        "Why Gemini invoked": "N/A"
      }, reqId);
      aiDebugLogger.logExit("Intent Router", reqId);
      return deterministicIntent;
    }

    aiDebugLogger.logSection("INTENT ROUTER", {
      "Deterministic routing used": false,
      "Matched rule": "N/A",
      "Why Gemini invoked": "Query did not match any deterministic keyword patterns."
    }, reqId);

    const aiIntent = await aiProvider.generateIntent(query, context, schema, reqId);
    aiDebugLogger.logExit("Intent Router", reqId);
    return aiIntent;

  } catch (error) {
    aiDebugLogger.logError("Intent Router", error, reqId, Date.now() - startTime);
    throw error;
  }
}

module.exports = { routeIntent, parseDeterministic };
