const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },
    projectCode: { type: String, required: true, unique: true }, // Auto Generated
    clientName: { type: String, required: true, trim: true },
    contractorName: { type: String, trim: true },
    siteEngineerName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    location: { type: String, required: true }, // Google Map Location
    manager: { type: String, trim: true },
    scope: { type: String, trim: true },
    progress: { type: Number, default: 0 },
    photo: { type: String },

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

    // ── Execution Tracker ──────────────────────────────────────────────
    selectedPhaseNames:    [{ type: String }],
    trackedActivityKeys:   [{ type: String }],
    completedActivityKeys: [{ type: String }],

    selectedPhases: [
      {
        id:        { type: String, required: true },
        phaseName: { type: String, required: true },
        isCustom:  { type: Boolean, default: false },
        activities: [
          {
            id:        { type: String, required: true },
            name:      { type: String, required: true },
            isCustom:  { type: Boolean, default: false },
            completed: { type: Boolean, default: false },
          }
        ]
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);