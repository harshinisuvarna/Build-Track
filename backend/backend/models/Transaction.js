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
  },
  { timestamps: true }
);

transactionSchema.index({ project: 1, createdBy: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ project: 1, type: 1 }); // for material filtering & reports

module.exports = mongoose.model("Transaction", transactionSchema);