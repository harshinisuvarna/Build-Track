const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const { protect, getAdminId, canAccessProjectFilter } = require("../middleware/auth");
const aiProvider = require("../services/ai/groqProvider.js");
const { GroqAuthError } = require("../services/ai/groqProvider.js");
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

const COLUMN_TO_FIELD_MAP = {
  "Purchased Date": "date",
  "Project": "projectName",
  "Type": "category",
  "Description": "item",
  "Brand": "brand",
  "Floor": "phase",
  "Phase": "phase",
  "Activity": "activity",
  "Unit": "unit",
  "Qty": "quantity",
  "Status": "paymentStatus",
  "Amount (INR)": "amount",
  "Worker": "worker",
  "Supplier": "supplier",
  "Rate": "rate",
  "Payment Date": "date"
};

function formatDynamicRows(rows, requestedColumns, tableType) {
  return rows.map((r, idx) => {
    const mobileRow = { number: idx + 1 };

    for (const colName of requestedColumns) {
      if (colName === "Amount (INR)" && tableType === "inventory") {
        mobileRow[colName] = r.closingStock ?? 0;
      } else {
        const fieldKey = COLUMN_TO_FIELD_MAP[colName];
        if (fieldKey && r[fieldKey] !== undefined && r[fieldKey] !== null && r[fieldKey] !== "") {

          if (colName === "Qty" && r.unit && r.unit !== "-") {
             mobileRow[colName] = `${r.quantity} ${r.unit}`;
          } else {
             mobileRow[colName] = r[fieldKey];
          }
        } else {
          mobileRow[colName] = "-";
        }
      }
    }
    return mobileRow;
  });
}

router.post("/query", async (req, res) => {
  const reqId = Math.random().toString(16).slice(2, 7).toUpperCase();

  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: "Query is required",
        message: "Please provide a search query.",
        statusCode: 400
      });
    }

    const baseScope = await buildBaseScope(req);
    const projectsList = baseScope.projects.map(p => ({
      id: p._id.toString(),
      name: p.projectName
    }));

    let queryPlan;
    try {
      queryPlan = await generateMongoQuery(
        query,
        baseScope.projectScopeIds,
        baseScope.adminId,
        projectsList
      );
    } catch (aiError) {

      if (aiError instanceof GroqAuthError || aiError.name === "GroqAuthError") {
        console.error(`[${reqId}] GroqAuthError: ${aiError.message}`);
        return res.status(500).json({
          success: false,
          error: "AI Service Authentication Failed",
          message: aiError.message,
          developer_details: `Caught ${aiError.statusCode || 401} from Groq`,
          statusCode: 500
        });
      }

      console.error(`[${reqId}] AI Query Generation Error:`, aiError.message);
      return res.status(500).json({
        success: false,
        error: "AI Query Generation Failed",
        message: aiError.message || "The AI service returned an unexpected response. Please try again.",
        developer_details: aiError.message,
        statusCode: 500
      });
    }

    const analyticsData = await executeAiQuery(
      queryPlan,
      baseScope.projectScopeIds
    );

    console.log(`[${reqId}] Query: "${query}" → ${analyticsData.rowCount} rows from ${queryPlan.collection}`);

    const mobileRows = formatDynamicRows(analyticsData.rows, queryPlan.requested_columns, analyticsData.tableType);
    const total = analyticsData.tableType === "inventory"
      ? (analyticsData.totalPurchased || 0)
      : (analyticsData.totalAmount || 0);

    let summary = `Found ${analyticsData.rowCount} records.`;
    try {
      summary = await aiProvider.generateSummary(analyticsData, query, reqId);
    } catch(e) {

      if (e instanceof GroqAuthError || e.name === "GroqAuthError") {
        console.error(`[${reqId}] Summary skipped (auth error): ${e.message}`);
        summary = `Found ${analyticsData.rowCount} records. (AI summary unavailable — API key issue)`;
      } else {
        console.error(`[${reqId}] Summary generation failed:`, e.message);
      }
    }

    let followUps = ["Export CSV", "Filter by project", "Show summary"];
    try {
      followUps = await aiProvider.generateFollowups({
        query,
        rowCount: analyticsData.rowCount,
        tableType: analyticsData.tableType,
        collection: queryPlan.collection
      }, reqId);
    } catch(e) {}

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
          columns: queryPlan.requested_columns,
          rows: mobileRows,
          total,
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

    if (error instanceof GroqAuthError || error.name === "GroqAuthError") {
      return res.status(500).json({
        success: false,
        error: "AI Service Authentication Failed",
        message: error.message,
        developer_details: `Caught ${error.statusCode || 401} from Groq`,
        statusCode: 500
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred. Please try again.",
      developer_details: error.message,
      statusCode: 500
    });
  }
});

module.exports = router;
