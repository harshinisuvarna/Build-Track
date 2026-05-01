const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Transaction = require("../models/Transaction");
const Project = require("../models/Project");
const { protect } = require("../middleware/auth");

router.use(protect);

const DEFAULT_THRESHOLD = 5;
const normalizeProjectId = (projectValue) => {
  if (!projectValue) return "";
  if (typeof projectValue === "object" && projectValue._id) return String(projectValue._id);
  return String(projectValue);
};

function normalizeMaterialType(tx) {
  if (tx.materialType === "usage") return "usage";
  if (tx.materialType === "purchase") return "purchase";
  if (tx.subType === "Consumption") return "usage";
  if (tx.subType === "Purchase") return "purchase";
  return "purchase";
}

function getStatus(balance, threshold) {
  if (balance <= 0) return "Out of Stock";
  if (balance <= threshold) return "Low Stock";
  return "In Stock";
}

router.get("/", async (req, res) => {
  try {
    const { project } = req.query;
    const query = { createdBy: req.user._id };
    if (project) query.project = project;

    const [materialsAgg, inventoryDocs] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: "Materials", category: { $exists: true, $ne: "" } } },
        {
          $addFields: {
            normalizedMaterialType: {
              $switch: {
                branches: [
                  { case: { $eq: ["$materialType", "usage"] }, then: "usage" },
                  { case: { $eq: ["$materialType", "purchase"] }, then: "purchase" },
                  { case: { $eq: ["$subType", "Consumption"] }, then: "usage" },
                  { case: { $eq: ["$subType", "Purchase"] }, then: "purchase" },
                ],
                default: "purchase",
              },
            },
          },
        },
        {
          $group: {
            _id: { project: "$project", materialName: "$category" },
            purchased: {
              $sum: {
                $cond: [{ $eq: ["$normalizedMaterialType", "purchase"] }, "$quantity", 0],
              },
            },
            used: {
              $sum: {
                $cond: [{ $eq: ["$normalizedMaterialType", "usage"] }, "$quantity", 0],
              },
            },
            unit: { $last: "$unit" },
          },
        },
      ]),
      Inventory.find(query).populate("project", "projectName"),
    ]);

    const byKey = new Map();
    const keyOf = (projectId, materialName) => `${normalizeProjectId(projectId)}::${String(materialName || "").trim().toLowerCase()}`;

    for (const doc of inventoryDocs) {
      byKey.set(keyOf(doc.project, doc.materialName), {
        _id: doc._id,
        createdBy: doc.createdBy,
        project: doc.project,
        materialName: doc.materialName,
        unit: doc.unit || "",
        purchased: 0,
        used: 0,
        closingStock: 0,
        threshold: Number(doc.threshold ?? DEFAULT_THRESHOLD),
      });
    }

    for (const row of materialsAgg) {
      const materialName = row._id.materialName;
      const projectId = row._id.project;
      const key = keyOf(projectId, materialName);
      const current = byKey.get(key) || {
        _id: undefined,
        project: projectId,
        materialName,
        unit: row.unit || "",
        purchased: 0,
        used: 0,
        closingStock: 0,
        threshold: DEFAULT_THRESHOLD,
      };
      const purchased = Number(row.purchased || 0);
      const used = Number(row.used || 0);
      current.purchased = purchased;
      current.used = used;
      current.closingStock = purchased - used;
      current.unit = current.unit || row.unit || "";
      byKey.set(key, current);
    }

    const projectIds = Array.from(
      new Set(
        Array.from(byKey.values())
          .map((item) => normalizeProjectId(item.project))
          .filter(Boolean)
      )
    );
    const projectDocs = await Project.find(
      { _id: { $in: projectIds }, createdBy: req.user._id },
      { projectName: 1 }
    ).lean();
    const projectMap = new Map(projectDocs.map((p) => [String(p._id), p]));

    const inventory = Array.from(byKey.values())
      .map((item) => ({
        ...item,
        project: (() => {
          if (!item.project) return null;
          if (typeof item.project === "object" && item.project.projectName) {
            return { _id: String(item.project._id), projectName: item.project.projectName };
          }
          const p = projectMap.get(normalizeProjectId(item.project));
          return p ? { _id: String(p._id), projectName: p.projectName } : null;
        })(),
        status: getStatus(item.closingStock, Number(item.threshold ?? DEFAULT_THRESHOLD)),
      }))
      .sort((a, b) => String(a.materialName).localeCompare(String(b.materialName)));

    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

router.post("/use", async (req, res) => {
  try {
    const { materialName, usedQty, project, threshold } = req.body;
    const qty = parseFloat(usedQty) || 0;

    if (!materialName) return res.status(400).json({ message: "Material name is required" });
    if (!project) return res.status(400).json({ message: "Project is required" });
    if (qty <= 0) return res.status(400).json({ message: "Valid used quantity is required" });

    let item = await Inventory.findOne({ project: project, materialName, createdBy: req.user._id });

    if (!item) {
      return res.status(404).json({ message: "Material not found in inventory for this project. Purchase it first." });
    }

    const newUsedQty = item.used + qty;
    if (newUsedQty > item.purchased) {
      return res.status(400).json({
        message: `Cannot use ${qty} ${item.unit || "units"} — only ${item.closingStock} ${item.unit || "units"} in stock.`,
      });
    }
    item.used = newUsedQty;
    item.closingStock = item.purchased - item.used;
    if (threshold !== undefined) item.threshold = Math.max(0, Number(threshold) || 0);
    await item.save();

    res.json({ message: "Inventory updated", item });

  } catch (err) {
    res.status(500).json({ message: "Failed to update inventory" });
  }
});

router.patch("/:id/threshold", async (req, res) => {
  try {
    const { threshold } = req.body;
    const nextThreshold = Number(threshold);
    if (!Number.isFinite(nextThreshold) || nextThreshold < 0) {
      return res.status(400).json({ message: "Threshold must be a number >= 0" });
    }

    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { $set: { threshold: nextThreshold } },
      { new: true }
    ).populate("project", "projectName");

    if (!item) return res.status(404).json({ message: "Inventory item not found" });
    const status = getStatus(item.closingStock || 0, item.threshold || DEFAULT_THRESHOLD);
    res.json({ message: "Threshold updated", item: { ...item.toObject(), status } });
  } catch (err) {
    res.status(500).json({ message: "Failed to update threshold" });
  }
});

module.exports = router;
