const Transaction = require("../../models/Transaction");
const Inventory = require("../../models/Inventory");
const mongoose = require("mongoose");

function toObjectId(id) {
  try { return new mongoose.Types.ObjectId(id.toString()); }
  catch { return null; }
}

function convertObjectIds(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertObjectIds);

  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "project" && typeof val === "string" && mongoose.Types.ObjectId.isValid(val)) {
      result[key] = toObjectId(val);
    } else if (key === "$in" && Array.isArray(val)) {
      result[key] = val.map(v =>
        typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
          ? toObjectId(v)
          : v
      ).filter(Boolean);
    } else if (typeof val === "object" && val !== null) {
      result[key] = convertObjectIds(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

async function executeAiQuery(queryPlan, projectScopeIds) {
  const scopeIds = projectScopeIds.map(toObjectId).filter(Boolean);

  let filter = convertObjectIds(
    JSON.parse(JSON.stringify(queryPlan.filter || {}))
  );

  if (!filter.project) {
    filter.project = { $in: scopeIds };
  } else if (filter.project && filter.project["$in"]) {

    const requested = filter.project["$in"].map(id => id.toString());
    const allowed = scopeIds.map(id => id.toString());
    const valid = requested.filter(id => allowed.includes(id));
    filter.project = {
      $in: valid.length > 0
        ? valid.map(toObjectId)
        : scopeIds
    };
  } else if (filter.project && mongoose.Types.ObjectId.isValid(filter.project)) {
    const pid = filter.project.toString();
    const allowed = scopeIds.map(id => id.toString());
    if (!allowed.includes(pid)) {
      filter.project = { $in: scopeIds };
    }
  }

  let rows = [];
  let totalAmount = null;
  let totalPurchased = null;
  let comparisonData = null;

  if (queryPlan.aggregateBy === "brand") {
    const pipeline = [
      { $match: filter },
      { $group: {
        _id: "$brand",
        totalAmount: { $sum: "$amount" },
        totalQty: { $sum: "$quantity" },
        avgRate: { $avg: "$rate" },
        count: { $sum: 1 }
      }},
      { $sort: { totalAmount: -1 } }
    ];

    const aggResult = await Transaction.aggregate(pipeline);
    comparisonData = {
      groupedBy: "brand",
      items: aggResult.map(r => ({
        brand: r._id || "Unknown/No Brand",
        totalAmount: Math.round(r.totalAmount || 0),
        totalQty: r.totalQty || 0,
        avgRate: Math.round(r.avgRate || 0),
        count: r.count
      }))
    };

    const docs = await Transaction.find(filter)
      .populate("project", "projectName")
      .populate("worker", "name")
      .sort({ date: -1 })
      .limit(100)
      .lean();
    rows = mapTransactionRows(docs);
    totalAmount = rows.reduce((s, r) => s + (r.amount || 0), 0);

  } else if (queryPlan.collection === "inventories") {

    if (filter.category === "material") {
      delete filter.category;
      filter["$or"] = [
        { category: "material" },
        { category: { $exists: false } },
        { category: null }
      ];
    }

    const docs = await Inventory.find(filter)
      .populate("project", "projectName")
      .limit(queryPlan.limit || 500)
      .lean();

    rows = docs.map(doc => {
      const pct = doc.threshold > 0 ? doc.closingStock / doc.threshold : 1;
      const severity = doc.closingStock <= 0 ? "critical"
        : pct <= 0.5 ? "critical"
        : pct < 1.0 ? "low"
        : "ok";
      return {
        date: doc.createdAt
          ? new Date(doc.createdAt).toISOString().slice(0, 10)
          : "-",
        projectName: doc.project?.projectName || "Unknown",
        item: doc.materialName || "-",
        name: doc.materialName || "-",
        category: doc.category || "material",
        purchased: doc.purchased ?? 0,
        used: doc.used ?? 0,
        closingStock: doc.closingStock ?? 0,
        quantity: String(doc.closingStock ?? 0),
        unit: doc.unit || "units",
        threshold: doc.threshold ?? 10,
        amount: 0,
        severity
      };
    });

    const order = { critical: 0, low: 1, ok: 2 };
    rows.sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2));
    totalPurchased = rows.reduce((s, r) => s + (r.purchased || 0), 0);

  } else {

    const docs = await Transaction.find(filter)
      .populate("project", "projectName")
      .populate("worker", "name")
      .sort(queryPlan.sort || { date: -1 })
      .limit(queryPlan.limit || 200)
      .lean();

    rows = mapTransactionRows(docs);
    totalAmount = rows.reduce((s, r) => s + (r.amount || 0), 0);
  }

  const projectMap = {};
  rows.forEach(r => {
    const p = r.projectName || "Unknown";
    if (!projectMap[p]) {
      projectMap[p] = { totalAmount: 0, totalItems: 0 };
    }
    projectMap[p].totalAmount += Number(r.amount) || 0;
    projectMap[p].totalItems += 1;
  });
  const projectBreakdown = Object.entries(projectMap)
    .map(([name, v]) => ({ projectName: name, ...v }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const metrics = {
    criticalCount: rows.filter(r => r.severity === "critical").length,
    lowCount: rows.filter(r => r.severity === "low").length,
    totalRows: rows.length
  };

  return {
    rows,
    rowCount: rows.length,
    totalAmount,
    totalPurchased,
    tableType: queryPlan.collection === "inventories" ? "inventory" : "entries",
    projectBreakdown,
    comparisonData,
    metrics,
    explanation: queryPlan.explanation
  };
}

function mapTransactionRows(docs) {
  return docs.map(t => ({
    date: t.date
      ? new Date(t.date).toISOString().slice(0, 10)
      : "-",
    projectName: t.project?.projectName || "Unknown",
    item: t.title || "-",
    category: t.type || "-",
    brand: t.brand || "-",
    supplier: t.supplier || "-",
    worker: t.worker?.name || "-",
    quantity: t.quantity != null ? String(t.quantity) : "-",
    unit: t.unit || "-",
    rate: t.rate || 0,
    amount: Number(t.amount || 0),
    paymentStatus: t.paymentStatus || "-",
    paidAmount: t.paidAmount || 0,
    remainingAmount: t.remainingAmount || 0,
    phase: t.phase || "-",
    activity: t.activity || "-"
  }));
}

module.exports = { executeAiQuery };
