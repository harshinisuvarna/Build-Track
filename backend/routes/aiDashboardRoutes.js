const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const { protect, getAdminId, canAccessProjectFilter } = require("../middleware/auth");
const aiProvider = require("../services/ai/groqProvider.js");
const { generateMongoQuery } = require("../services/reports/mongoAiQueryGenerator");
const { executeAiQuery } = require("../services/reports/mongoAiExecutor");

router.use(protect);

async function buildBaseScope(req) {
  const isAdmin = req.user.role === "Admin";
  const adminId = await getAdminId(req.user);
  const projectFilter = isAdmin
    ? { createdBy: req.user._id }
    : canAccessProjectFilter(req);
  const projects = await Project.find(projectFilter)
    .select("_id projectName").lean();
  const projectScopeIds = projects.map(p => p._id);
  return { isAdmin, adminId, projectFilter, projectScopeIds, projects };
}

router.post("/query", async (req, res) => {
  const reqId = Math.random().toString(16).slice(2, 7).toUpperCase();

  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Query is required" });
    }

    // 1. Get user's project scope
    const baseScope = await buildBaseScope(req);
    const projectsList = baseScope.projects.map(p => ({
      id: p._id.toString(),
      name: p.projectName
    }));

    // 2. AI generates the MongoDB query plan
    const queryPlan = await generateMongoQuery(
      query,
      baseScope.projectScopeIds,
      baseScope.adminId,
      projectsList
    );

    // 3. Execute safely
    const analyticsData = await executeAiQuery(
      queryPlan,
      baseScope.projectScopeIds
    );

    console.log(`[${reqId}] Query: "${query}" → ${analyticsData.rowCount} rows from ${queryPlan.collection}`);

    // 4. Generate AI summary
    let summary = `Found ${analyticsData.rowCount} records.`;
    try {
      summary = await aiProvider.generateSummary(analyticsData, query, reqId);
    } catch(e) {
      console.error("Summary generation failed:", e.message);
    }

    // 5. Generate follow-ups
    let followUps = ["Export CSV", "Filter by project", "Show summary"];
    try {
      followUps = await aiProvider.generateFollowups({
        query,
        rowCount: analyticsData.rowCount,
        tableType: analyticsData.tableType,
        collection: queryPlan.collection
      }, reqId);
    } catch(e) {}

    // 6. Generate alerts (low stock warnings)
    let alerts = [];
    try {
      if (queryPlan.collection === "inventories") {
        alerts = analyticsData.rows
          .filter(r => r.severity === "critical")
          .map(r => ({
            type: "critical",
            message: `${r.item} is critically low: ${r.closingStock} ${r.unit} remaining (min: ${r.threshold})`
          }));
        const lowAlerts = analyticsData.rows
          .filter(r => r.severity === "low")
          .map(r => ({
            type: "warning",
            message: `${r.item} is running low: ${r.closingStock} ${r.unit} remaining`
          }));
        alerts = [...alerts, ...lowAlerts];
      }
    } catch(e) {}

    return res.json({
      success: true,
      data: {
        summary,
        metrics: analyticsData.metrics,
        table: {
          type: analyticsData.tableType,
          rows: analyticsData.rows,
          totalAmount: analyticsData.totalAmount,
          totalPurchased: analyticsData.totalPurchased,
          rowCount: analyticsData.rowCount
        },
        charts: {
          projectBreakdown: analyticsData.projectBreakdown,
          comparisonData: analyticsData.comparisonData
        },
        alerts,
        actions: followUps
      }
    });

  } catch (error) {
    console.error(`[${reqId}] AI Dashboard Error:`, error.message);
    const status = [401, 403].includes(error.response?.status) ? 502 : 500;
    return res.status(status).json({
      error: error.message || "Internal server error"
    });
  }
});

module.exports = router;
