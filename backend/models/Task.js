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
    assignee: {
      type: String,
      default: "Unknown Mason",
      trim: true,
    },
    location: {
      type: String,
      default: "On Site",
      trim: true,
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
