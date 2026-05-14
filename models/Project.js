const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectCode: { type: String, required: true, unique: true }, // Auto Generated
    clientName: { type: String, required: true, trim: true },
    contractorName: { type: String, trim: true },
    siteEngineerName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    location: { type: String, required: true }, // Google Map Location

    buildingType: {
      mainType: {
        type: String,
        enum: ["Residential", "Educational", "Institutional", "Commercial", "Industrial"],
        required: true
      },
      subType: { type: String, required: true }
    },

    dates: {
      startDate: { type: Date },
      expectedEndDate: { type: Date },
      actualEndDate: { type: Date }
    },

    budget: {
      total: { type: Number, default: 0 },
      material: { type: Number, default: 0 },
      labour: { type: Number, default: 0 },
      equipment: { type: Number, default: 0 },
      misc: { type: Number, default: 0 }
    },

    status: {
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"],
      default: "Planning"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);