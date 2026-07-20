const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    assignee: {
      type: String,
      default: "Unknown Mason",
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    floorId: {
      type: String,
      default: null,
    },
    floorName: {
      type: String,
      default: null,
    },
    phaseId: {
      type: String,
      default: null,
    },
    phaseName: {
      type: String,
      default: null,
    },
    activityId: {
      type: String,
      default: null,
    },
    activityName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    time: {
      type: String,
      default: "Today",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
