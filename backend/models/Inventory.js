const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    openingStock: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
    closingStock: {
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

// Unique material name per project
inventorySchema.index({ project: 1, materialName: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
