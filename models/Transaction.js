const mongoose = require("mongoose");
const toObjectIdOrNull = function (value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "object" && value?._id) value = value._id;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};
const transactionSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      default: "",
      trim: true,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["Wages", "Expense", "Income", "Materials"],
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
      set: toObjectIdOrNull,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      set: toObjectIdOrNull,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },

    // ── Materials ──────────────────────────────
    brand: {
      type: String,
      default: "",
      trim: true,
    },

    unitType: {
      type: String,
      enum: ["kg", "bag", "ton", "MT", "sqft", "truck", ""],
      default: "",
    },

    // quantity & rate already exist above; added below only if missing
    // (quantity and rate are already in the schema — no duplication needed)

    // ── Wages ──────────────────────────────────
    rateType: {
      type: String,
      enum: ["day", "sqft", "hour", ""],
      default: "",
    },

    workDone: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Equipment / Expense ────────────────────
    usage: {
      type: Number,
      default: 0,
      min: 0,
    },

    machineType: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Generic ────────────────────────────────
    category: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Payment ────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partially Paid", "Pending", "Partial", "Advance", ""],
      default: "",
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Bank", ""],
      default: "",
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);
transactionSchema.index({ project: 1, createdBy: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ project: 1, type: 1 }); // for material filtering & reports
module.exports = mongoose.model("Transaction", transactionSchema);