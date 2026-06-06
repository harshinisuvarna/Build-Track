const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Project = require("../models/Project");
const { protect, requirePermission, getAdminId, canAccessProjectFilter } = require("../middleware/auth");

router.use(protect);
router.use(requirePermission(["manage_material_master", "manage_expenses"]));

router.get("/", async (req, res) => {
  try {
    const { project } = req.query;
    const query = {};

    if (project) {
      const pDoc = await Project.findOne(canAccessProjectFilter(req, project));
      if (!pDoc) {
        return res.status(403).json({ message: "Access denied to this project" });
      }
      query.project = project;
    } else {
      const projectFilter = canAccessProjectFilter(req);
      const projects = await Project.find(projectFilter).select("_id");
      const projectIds = projects.map(p => p._id);
      query.project = { $in: projectIds };
    }

    const inventory = await Inventory.find(query).sort({ materialName: 1 }).populate("project", "projectName");
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { materialName, purchased, unit, project, category, threshold } = req.body;
    if (!materialName) return res.status(400).json({ message: "materialName is required" });
    if (!project)      return res.status(400).json({ message: "project is required" });

    const qty = parseFloat(purchased) || 0;
    if (qty <= 0) return res.status(400).json({ message: "Valid quantity is required" });

    const pDoc = await Project.findOne(canAccessProjectFilter(req, project));
    if (!pDoc) {
      return res.status(403).json({ message: "Access denied to this project" });
    }

    const adminId = await getAdminId(req.user);
    let item = await Inventory.findOne({ project, materialName, createdBy: adminId });
    if (item) {
      // Item already exists — top up the stock
      item.purchased   += qty;
      item.closingStock = item.purchased - item.used;
    } else {
      // Brand new item
      item = new Inventory({
        materialName,
        purchased:    qty,
        used:         0,
        closingStock: qty,
        unit:         unit      || 'units',
        category:     category  || 'material',
        threshold:    parseFloat(threshold) || 10,
        project,
        createdBy: adminId,
      });
    }
    await item.save();
    res.json({ message: "Inventory item added", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to add inventory item" });
  }
});

router.post("/use", async (req, res) => {
  try {
    const { materialName, usedQty, project } = req.body;
    const qty = parseFloat(usedQty) || 0;

    if (!materialName) return res.status(400).json({ message: "Material name is required" });
    if (!project) return res.status(400).json({ message: "Project is required" });
    if (qty <= 0) return res.status(400).json({ message: "Valid used quantity is required" });

    const pDoc = await Project.findOne(canAccessProjectFilter(req, project));
    if (!pDoc) {
      return res.status(403).json({ message: "Access denied to this project" });
    }

    const adminId = await getAdminId(req.user);
    let item = await Inventory.findOne({ project: project, materialName, createdBy: adminId });

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
    await item.save();

    res.json({ message: "Inventory updated", item });

  } catch (err) {
    res.status(500).json({ message: "Failed to update inventory" });
  }
});

module.exports = router;