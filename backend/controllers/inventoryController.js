const Inventory = require("../models/Inventory");

const applyInventoryDelta = async (materialId, quantity, actionType) => {
  let delta = 0;
  if (actionType === 'add') {
    delta = quantity;
  } else if (actionType === 'use') {
    delta = -quantity;
  }
  return await Inventory.findByIdAndUpdate(
    materialId,
    { $inc: { currentStock: delta } },
    { new: true }
  );
};

const createMaterial = async (req, res) => {
  try {
    const { materialName, project, unit, openingStock, threshold } = req.body;

    if (!materialName || !String(materialName).trim()) {
      return res.status(400).json({ message: "materialName is required" });
    }
    if (!project) {
      return res.status(400).json({ message: "project (projectId) is required" });
    }

    const doc = new Inventory({
      createdBy: req.user._id,
      project,
      materialName: String(materialName).trim(),
      unit: unit || "",
      openingStock: Number(openingStock) || 0,
      closingStock: Number(openingStock) || 0,
      threshold: threshold !== undefined ? Math.max(0, Number(threshold)) : 5,
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "This material already exists for the selected project" });
    }
    console.error("createMaterial error:", err);
    res.status(500).json({ message: "Failed to create material" });
  }
};

module.exports = { applyInventoryDelta, createMaterial };
