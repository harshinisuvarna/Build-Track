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
    category: {
      type: String,
      default: "material",
      trim: true,
    },
    unit: {
      type: String,
      default: "units",
      trim: true,
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
    threshold: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

inventorySchema.index(
  { createdBy: 1, project: 1, materialName: 1 },
  { unique: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
