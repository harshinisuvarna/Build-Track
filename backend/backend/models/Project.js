const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },

    projectCode: {
      type: String,
      required: true,
      unique: true,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    contractorName: {
      type: String,
      trim: true,
    },

    siteEngineerName: {
      type: String,
      trim: true,
    },

    contactNumber: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      required: true,
    },

    manager: {
      type: String,
      trim: true,
    },

    scope: {
      type: String,
      trim: true,
    },

    progress: {
      type: Number,
      default: 0,
    },

    photo: {
      type: String,
    },

    // ======================================================
    // BUILDING TYPE
    // ======================================================

    buildingType: {
      mainType: {
        type: String,
        enum: [
          "Residential",
          "Educational",
          "Institutional",
          "Commercial",
          "Industrial",
        ],
        required: true,
      },

      subType: {
        type: String,
        required: true,
      },
    },

    // ======================================================
    // DATES
    // ======================================================

    dates: {
      startDate: { type: Date },

      expectedEndDate: { type: Date },

      actualEndDate: { type: Date },
    },

    // ======================================================
    // BUDGET
    // ======================================================

    budget: {
      total: {
        type: Number,
        default: 0,
      },

      material: {
        type: Number,
        default: 0,
      },

      labour: {
        type: Number,
        default: 0,
      },

      equipment: {
        type: Number,
        default: 0,
      },

      misc: {
        type: Number,
        default: 0,
      },
    },

    // ======================================================
    // OPTIONAL ANALYTICS FIELDS
    // ======================================================

    builtUpArea: {
      type: Number,
      default: 0,
    },

    builtUpAreaUnit: {
      type: String,
      enum: ["sqft", "sqm"],
      default: "sqft",
    },

    targetCostPerSqft: {
      type: Number,
      default: 1500,
    },

    currentCostPerSqft: {
      type: Number,
      default: 0,
    },

    // ======================================================
    // PROJECT STATUS
    // ======================================================

    status: {
      type: String,
      enum: [
        "Planning",
        "In Progress",
        "On Hold",
        "Completed",
        "Cancelled",
      ],
      default: "Planning",
    },

    // ======================================================
    // EXECUTION TRACKER
    // ======================================================

    selectedPhaseNames: [{ type: String }],

    trackedActivityKeys: [{ type: String }],

    completedActivityKeys: [{ type: String }],

    selectedPhases: [
      {
        id: {
          type: String,
          required: true,
        },

        phaseName: {
          type: String,
          required: true,
        },

        isCustom: {
          type: Boolean,
          default: false,
        },

        activities: [
          {
            id: {
              type: String,
              required: true,
            },

            name: {
              type: String,
              required: true,
            },

            isCustom: {
              type: Boolean,
              default: false,
            },

            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],

    // ======================================================
    // OWNER
    // ======================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },

  { timestamps: true }
);
module.exports = mongoose.model("Project", projectSchema);
