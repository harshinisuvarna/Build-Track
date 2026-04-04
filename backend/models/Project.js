// backend/models/Project.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    manager: {
      type: String,
      default: "",
      trim: true,
    },

    budget: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    scope: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold", "Review Needed"],
      default: "Active",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    photo: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
