const summaryCache = new Map();
const aiDebugLogger = require("../../utils/aiDebugLogger");

async function generateSummary(intent, analyticsData, userQuery, aiProvider, reqId) {
  aiDebugLogger.logEnter("Summary Generator", reqId);
  const startTime = Date.now();

  try {

  const cacheKey = `${intent.intent}_${intent.category}_${analyticsData.rowCount}_${analyticsData.totalAmount}`;

  if (summaryCache.has(cacheKey)) {
     const cached = summaryCache.get(cacheKey);
     aiDebugLogger.logSection("SUMMARY GENERATION", {
       "Was Gemini used?": false,
       "Explain why": "Matched cache",
       "Summary": cached
     }, reqId);
     aiDebugLogger.logExit("Summary Generator", reqId);
     return cached;
  }

  let deterministicSummary = null;

  const fmtINR = (v) => {
      const num = Number(v);
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
      if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
      return `₹${num.toFixed(0)}`;
  };

  if (intent.intent === "inventory_status") {
    const { criticalCount, lowCount } = analyticsData.metrics;
    const total = analyticsData.rowCount;
    if (total === 0) {
        deterministicSummary = "No inventory tracked for this selection.";
    } else if (criticalCount > 0) {
       deterministicSummary = `${total} materials tracked. ${criticalCount} are at critical levels and need immediate restock.`;
    } else if (lowCount > 0) {
       deterministicSummary = `${total} materials tracked. ${lowCount} are running low.`;
    } else {
       deterministicSummary = `All ${total} materials are at healthy stock levels.`;
    }
  } else if (intent.intent === "resource_report" && intent.aggregation === "summary") {
    if (analyticsData.rowCount === 0) {
       deterministicSummary = `No records found for the requested criteria.`;
    } else {
       deterministicSummary = `Found ${analyticsData.rowCount} entries totaling ${fmtINR(analyticsData.totalAmount)}.`;
    }
  } else if (intent.intent === "pending_payments") {
    if (analyticsData.rowCount === 0) {
        deterministicSummary = "No pending payments found.";
    } else {
        deterministicSummary = `There are ${analyticsData.rowCount} pending payments totaling ${fmtINR(analyticsData.totalAmount)}.`;
    }
  } else if (intent.intent === "budget_health") {
    if (analyticsData.rowCount === 0) {
        deterministicSummary = "No project budgets found.";
    } else {
        deterministicSummary = `Budget health overview across ${analyticsData.rowCount} projects. Total budget: ${fmtINR(analyticsData.totalAmount)}.`;
    }
  }

  if (!deterministicSummary && intent.isDeterministic) {
     if (analyticsData.rowCount === 0) {
         deterministicSummary = "No records found for the requested criteria.";
     } else {
         deterministicSummary = `Found ${analyticsData.rowCount} records totaling ${fmtINR(analyticsData.totalAmount)}.`;
     }
  }

  if (deterministicSummary) {
    if (summaryCache.size < 500) summaryCache.set(cacheKey, deterministicSummary);
    aiDebugLogger.logSection("SUMMARY GENERATION", {
      "Was Gemini used?": false,
      "Explain why": "Matched deterministic rule based on intent mapping",
      "Summary": deterministicSummary
    }, reqId);
    aiDebugLogger.logExit("Summary Generator", reqId);
    return deterministicSummary;
  }

  const aiSummary = await aiProvider.generateSummary(analyticsData, userQuery, reqId);
  if (summaryCache.size < 500) summaryCache.set(cacheKey, aiSummary);
  aiDebugLogger.logSection("SUMMARY GENERATION", {
    "Was Gemini used?": true,
    "Exact prompt": "Dynamically generated prompt with analytics data (see GEMINI INPUT logger)",
    "Exact response": aiSummary
  }, reqId);

  aiDebugLogger.logExit("Summary Generator", reqId);
  return aiSummary;

  } catch (error) {
    aiDebugLogger.logError("Summary Generator", error, reqId, Date.now() - startTime);
    throw error;
  }
}

module.exports = { generateSummary };
