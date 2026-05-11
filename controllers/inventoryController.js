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

module.exports = { applyInventoryDelta };
