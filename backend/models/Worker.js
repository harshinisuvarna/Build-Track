// backend/models/Worker.js
const mongoose = require("mongoose");
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
    displayId: {
      type: String,
      default: null,
      index: true,
    },
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
workerSchema.pre("save", function () {
  if (this.isModified("name") && this.name) {
    this.name = toTitleCase(this.name);
  }
});
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
