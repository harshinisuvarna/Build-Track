// backend/models/Worker.js
const mongoose = require("mongoose");

// ── Title-case helper (Bug #7: Worker Name Validation) ───────────────────────
// "HARSHINI" → "Harshini", "nidhi kumar" → "Nidhi Kumar"
function toTitleCase(str) {
  if (!str) return str;
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

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

    // Auto-generated e.g. BT-2026-001
    displayId: {
      type: String,
      default: null,
      index: true,
    },

    // Filename only — e.g. "1711000000000-123.jpg"
    // Full URL served as: http://localhost:5000/uploads/{photo}
    photo: {
      type: String,
      default: null,
    },

    documents: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ── Normalize name to title-case on every save (Bug #7) ─────────────────────
workerSchema.pre("save", function () {
  if (this.isModified("name") && this.name) {
    this.name = toTitleCase(this.name);
  }
});

// Generate displayId on create (per-user sequence per year)
workerSchema.pre("save", async function () {
  if (this.displayId) return;
  if (!this.isNew) return;
  if (!this.createdBy) return;

  const year = new Date().getFullYear();
  const prefix = `BT-${year}-`;
  const Worker = mongoose.model("Worker");

  const count = await Worker.countDocuments({
    createdBy: this.createdBy,
    displayId: { $regex: `^${prefix}` },
  });

  this.displayId = `${prefix}${String(count + 1).padStart(3, "0")}`;
});

// Ensure API always returns some displayId for legacy documents
workerSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (!ret.displayId) {
      const year = ret.createdAt ? new Date(ret.createdAt).getFullYear() : new Date().getFullYear();
      const seq = String(ret._id || "").slice(-3).toUpperCase();
      ret.displayId = `BT-${year}-${seq || "000"}`;
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Worker", workerSchema);
