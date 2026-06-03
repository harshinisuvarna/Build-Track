const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // ======================================================
    // CORE IDENTITY
    // ======================================================

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

    // FIX: Flutter sends 'siteEngineer', schema had 'siteEngineerName' — added both
    siteEngineer: {
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

    mapAddress: {
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
          "Business / Commercial",
        ],
        // FIX: was required:true — removed so partial updates don't fail
        required: false,
      },
      subType: {
        type: String,
        required: false,
      },
    },

    // ======================================================
    // LAND & FLOORS
    // ======================================================

    // FIX: was missing — Flutter sends floors as array of chip labels
    floors: {
      type: [String],
      default: [],
    },

    landArea: {
      type: String,
      trim: true,
    },

    landUnit: {
      type: String,
      default: "Sq ft",
    },

    // ======================================================
    // ROOMS
    // ======================================================

    // FIX: all room/bathroom fields were missing from schema
    room1BHK: { type: Number, default: null },
    room2BHK: { type: Number, default: null },
    room3BHK: { type: Number, default: null },
    roomCustom: { type: Number, default: null },

    bathWestern: { type: Number, default: null },
    bathIndian: { type: Number, default: null },
    bathCommon: { type: Number, default: null },
    bathAttached: { type: Number, default: null },

    // ======================================================
    // ADDITIONAL FEATURES
    // ======================================================

    // FIX: was missing — Flutter stores selected checkboxes here
    selectedFeatures: {
      type: [String],
      default: [],
    },

    // ======================================================
    // DATES
    // ======================================================

    // FIX: startDate also stored at root level to match Flutter's toJson()
    // Flutter sends: 'startDate' at root AND nested under 'dates'
    startDate: {
      type: Date,
    },

    dates: {
      startDate: { type: Date },
      expectedEndDate: { type: Date },
      actualEndDate: { type: Date },
    },

    // FIX: expectedEndDate at root level too (Flutter sends at root)
    expectedEndDate: {
      type: Date,
    },

    // ======================================================
    // BUDGET
    // ======================================================

    budget: {
      total: { type: Number, default: 0 },
      material: { type: Number, default: 0 },
      labour: { type: Number, default: 0 },
      equipment: { type: Number, default: 0 },
      misc: { type: Number, default: 0 },
    },

    // FIX: also store budget fields at root level — Flutter reads budgetMaterial etc.
    budgetMaterial: { type: Number, default: 0 },
    budgetLabour: { type: Number, default: 0 },
    budgetEquipment: { type: Number, default: 0 },
    budgetMisc: { type: Number, default: 0 },
    totalBudget: { type: Number, default: 0 },

    // ======================================================
    // OPTIONAL ANALYTICS
    // ======================================================

    builtUpArea: { type: Number, default: 0 },
    builtUpAreaUnit: { type: String, enum: ["sqft", "sqm"], default: "sqft" },
    targetCostPerSqft: { type: Number, default: 1500 },
    currentCostPerSqft: { type: Number, default: 0 },

    // ======================================================
    // PROJECT STATUS — TWO FIELDS
    // ======================================================

    // Backend lifecycle status (used for filtering)
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold", "Review Needed"],
      default: "Active",
    },

    // FIX: UI-facing status — Flutter stores the label the user picked
    // ('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled')
    projectStatus: {
      type: String,
      trim: true,
    },

    // ======================================================
    // EXECUTION TRACKER
    // ======================================================

    selectedPhaseNames: [{ type: String }],
    trackedActivityKeys: [{ type: String }],
    completedActivityKeys: [{ type: String }],

    selectedPhases: [
      {
        id: { type: String, required: true },
        phaseName: { type: String, required: true },
        isCustom: { type: Boolean, default: false },
        activities: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            isCustom: { type: Boolean, default: false },
            completed: { type: Boolean, default: false },
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