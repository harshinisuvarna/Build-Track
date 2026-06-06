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

// ── CRITICAL FIX ─────────────────────────────────────────────────────────────
// The old index was { createdBy, materialName } which collided when:
//   - Two different projects both have a material called "structural"
//   - A non-admin user's entries use the admin's createdBy (via getAdminId)
//
// The correct unique constraint is { createdBy, project, materialName }:
// one inventory record per material per project per organisation.
//
// ACTION REQUIRED on first deploy:
//   db.inventories.dropIndex("createdBy_1_materialName_1")
// MongoDB will then create the new index automatically on next server start.
// ─────────────────────────────────────────────────────────────────────────────
inventorySchema.index(
  { createdBy: 1, project: 1, materialName: 1 },
  { unique: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);