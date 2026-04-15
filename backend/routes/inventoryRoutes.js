const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const { project } = req.query;
    const query = { createdBy: req.user._id };
    if (project) query.project = project;

    const inventory = await Inventory.find(query).sort({ materialName: 1 }).populate("project", "projectName");
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

router.post("/use", async (req, res) => {
  try {
    const { materialName, usedQty, project } = req.body;
    const qty = parseFloat(usedQty) || 0;

    if (!materialName) return res.status(400).json({ message: "Material name is required" });
    if (!project) return res.status(400).json({ message: "Project is required" });
    if (qty <= 0) return res.status(400).json({ message: "Valid used quantity is required" });

    let item = await Inventory.findOne({ project: project, materialName });

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
