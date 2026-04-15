const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/inventory - List all inventory items
router.get("/", async (req, res) => {
  try {
    const inventory = await Inventory.find({ createdBy: req.user._id }).sort({ materialName: 1 });
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// POST /api/inventory/use - Mark materials as used
router.post("/use", async (req, res) => {
  try {
    const { materialName, usedQty } = req.body;
    const qty = parseFloat(usedQty) || 0;

    if (!materialName) return res.status(400).json({ message: "Material name is required" });
    if (qty <= 0) return res.status(400).json({ message: "Valid used quantity is required" });

    let item = await Inventory.findOne({ createdBy: req.user._id, materialName });

    if (!item) {
      return res.status(404).json({ message: "Material not found in inventory. Purchase it first." });
    }

    const newUsedQty = item.usedQty + qty;
    if (newUsedQty > item.purchasedQty) {
      return res.status(400).json({
        message: `Cannot use ${qty} ${item.unit || "units"} — only ${item.balanceQty} ${item.unit || "units"} in stock.`,
      });
    }
    item.usedQty = newUsedQty;
    item.balanceQty = item.purchasedQty - item.usedQty;
    await item.save();

    res.json({ message: "Inventory updated", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to update inventory" });
  }
});

module.exports = router;
