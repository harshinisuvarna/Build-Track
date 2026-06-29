const Transaction = require("../../models/Transaction");
const Inventory = require("../../models/Inventory");
const aiDebugLogger = require("../../utils/aiDebugLogger");

/**
 * Executes the query and calculates totals and aggregations.
 */
async function processAnalytics(intent, query, scope, reqId) {
  aiDebugLogger.logEnter("Analytics Engine", reqId);
  const startTime = Date.now();
  
  try {
    let results = {
    totalAmount: 0,
    rowCount: 0,
    rows: [],
    inventoryRows: [],
    metrics: {},
    projectBreakdown: []
  };

  if (intent.intent === "comparison_report") {
    results.comparisonData = { items: [] };
    if (intent.compareItems && Array.isArray(intent.compareItems)) {
      for (const item of intent.compareItems) {
         const itemQuery = { ...query };
         itemQuery.brand = { $regex: new RegExp(item, "i") };
         const aggPipeline = [
           { $match: itemQuery },
           { $group: { 
               _id: "$project", 
               totalAmount: { $sum: "$amount" }, 
               totalQty: { $sum: "$quantity" } 
           } },
           { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "projectDetails" } },
           { $unwind: { path: "$projectDetails", preserveNullAndEmptyArrays: true } }
         ];
         const aggResults = await Transaction.aggregate(aggPipeline);
         let totalQty = 0;
         let totalAmount = 0;
         const projectBreakdown = aggResults.map(r => {
            totalAmount += r.totalAmount || 0;
            totalQty += r.totalQty || 0;
            return {
               projectName: r.projectDetails ? r.projectDetails.projectName : "Unknown",
               totalAmount: r.totalAmount,
               totalQty: r.totalQty
            };
         });
         results.comparisonData.items.push({
            name: item,
            totalQty,
            totalAmount,
            projectBreakdown
         });
      }
    }
    return results;
  }

  if (intent.intent === "inventory_status") {
    // query is now completely built by mongoQueryBuilder for Inventory!
    let items = await Inventory.find(query).populate("project", "projectName").lean();
    
    results.rows = items.map(doc => {
       const pct = doc.threshold > 0 ? doc.closingStock / doc.threshold : 1;
       const severity = doc.closingStock <= 0 ? "critical" : pct <= 0.5 ? "critical" : pct < 1.0 ? "low" : "ok";
       
       return {
         // Transaction-like fields for the table
         date: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
         projectName: doc.project?.projectName || "Unknown",
         item: doc.materialName,
         quantity: String(doc.closingStock),
         unit: doc.unit || "units",
         amount: 0,
         
         // Inventory-specific fields
         name: doc.materialName,
         category: doc.category,
         purchased: doc.purchased,
         used: doc.used,
         closingStock: doc.closingStock,
         threshold: doc.threshold,
         severity: severity
       };
    });
    
    // Apply filters if deterministically requested
    if (intent.filters && intent.filters.severity) {
       results.rows = results.rows.filter(r => intent.filters.severity.includes(r.severity));
    }
    
    // Sort
    const order = { critical: 0, low: 1, ok: 2 };
    results.rows.sort((a, b) => order[a.severity] - order[b.severity]);
    
    results.metrics.criticalCount = results.rows.filter(r => r.severity === "critical").length;
    results.metrics.lowCount = results.rows.filter(r => r.severity === "low").length;
    results.rowCount = results.rows.length;
    results.totalAmount = null;

    results.rowCount = results.rows.length;

    // Feature 3: Cross Project Breakdown for Inventory
    const projectTotals = {};
    items.forEach(doc => {
       const pName = doc.project?.projectName || "Unknown";
       if (!projectTotals[pName]) projectTotals[pName] = { totalItems: 0, totalPurchased: 0 };
       projectTotals[pName].totalItems += 1;
       projectTotals[pName].totalPurchased += Number(doc.purchased || 0);
    });
    results.projectBreakdown = Object.keys(projectTotals).map(name => ({
       projectName: name,
       totalItems: projectTotals[name].totalItems,
       totalPurchased: projectTotals[name].totalPurchased
    })).sort((a,b) => b.totalPurchased - a.totalPurchased);


  } else {
    // Transaction query
    const txs = await Transaction.find(query)
      .populate("project", "projectName")
      .sort({ date: -1 })
      .limit(100)
      .lean();
    
    results.totalAmount = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    results.rowCount = txs.length;
    
    results.rows = txs.map(t => ({
      date: new Date(t.date).toISOString().slice(0, 10),
      item: t.title || t.category || "-",
      quantity: t.quantity ? String(t.quantity) : null,
      unit: t.unit || null,
      amount: Number(t.amount || 0),
      projectName: t.project?.projectName || "-"
    }));
    

    // Feature 3: Cross Project Breakdown for Transactions
    if (!query.project || query.project === "all" || query.project.$in) {
       const projectTotals = {};
       txs.forEach(t => {
          const pName = t.project?.projectName || "Unknown";
          if (!projectTotals[pName]) projectTotals[pName] = { totalAmount: 0, totalQty: 0 };
          projectTotals[pName].totalAmount += Number(t.amount || 0);
          projectTotals[pName].totalQty += Number(t.quantity || 0);
       });
       results.projectBreakdown = Object.keys(projectTotals).map(name => ({
          projectName: name,
          totalAmount: projectTotals[name].totalAmount,
          totalQty: projectTotals[name].totalQty
       })).sort((a,b) => b.totalAmount - a.totalAmount);
    }
  }

  aiDebugLogger.logSection("ANALYTICS ENGINE", {
    "Rows received (from Mongo)": results.rowCount,
    "Metrics calculated": results.metrics,
    "Rows forwarded (to Summary/UI)": results.rowCount,
    "Charts generated": Object.keys(results.metrics).length > 0 ? Object.keys(results.metrics) : "None"
  }, reqId);

  aiDebugLogger.logExit("Analytics Engine", reqId);
  return results;

  } catch (error) {
    aiDebugLogger.logError("Analytics Engine", error, reqId, Date.now() - startTime);
    throw error;
  }
}

module.exports = { processAnalytics };
