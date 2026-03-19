// backend/models/Worker.js
const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    // Worker belongs to the user who created them
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    trade: {
      type: String,
      required: true,
      enum: ["Mason", "Carpenter", "Electrician", "Plumber", "Welder",
             "Painter", "General Labor", "Site Engineer", "Supervisor", "Foreman",
             "Laborer", "Architect", "Inspector", "Site Manager", "Engineer", "Other"],
      default: "General Labor",
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
    },

    joiningDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave"],
      default: "Active",
    },

    dailyWage: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    paymentCycle: {
      type: String,
      enum: ["Weekly", "Bi-Weekly", "Monthly"],
      default: "Weekly",
    },

    // Filename only — e.g. "1711000000000-123.jpg"
    // Full URL served as: http://localhost:5000/uploads/{photo}
    photo: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual: auto-generate a display ID like BT-2024-001
workerSchema.virtual("displayId").get(function () {
  const year = new Date(this.createdAt).getFullYear();
  const seq  = String(this._id).slice(-3).toUpperCase();
  return `#BT-${year}-${seq}`;
});

// Include virtuals in JSON output
workerSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Worker", workerSchema);
