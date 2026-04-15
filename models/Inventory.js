const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    purchasedQty: {
      type: Number,
      default: 0,
    },
    usedQty: {
      type: Number,
      default: 0,
    },
    balanceQty: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Unique material name per user
inventorySchema.index({ createdBy: 1, materialName: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
