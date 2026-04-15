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
    category: {
      type: String,
      trim: true,
    },
    brand: String,
    subType: {
      type: String,
      enum: ["Purchase", "Consumption", "cement", "brick", "stone", ""],
      default: "",
    },
    unit: {
      type: String,
      enum: ["kg", "bag", "sqft", "day", "hour", "unit", "ton", "MT", "truck", ""],
      default: "unit",
    },
    quantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    rate: {
      type: Number,
      min: 0,
      default: 0,
    },
    // AUTO CALCULATED
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
    // PAYMENT TRACKING
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Pending", ""],
      default: "Pending",
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "Bank", "UPI", "Cheque", ""],
      default: "Cash",
    },
    paymentDate: Date,
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    attachments: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

transactionSchema.pre("save", function (next) {
  // Auto-calculate total amount
  if (this.quantity && this.rate) {
    this.amount = this.quantity * this.rate;
  }

  // Auto-calculate payment balance
  if (this.paymentStatus === "Paid") {
    this.paidAmount = this.amount;
    this.remainingAmount = 0;
  } else if (this.paymentStatus === "Pending") {
    this.paidAmount = 0;
    this.remainingAmount = this.amount;
  } else if (this.paymentStatus === "Partial") {
    this.remainingAmount = this.amount - (this.paidAmount || 0);
  }

  // Hard validation for paidAmount
  if (this.paidAmount > this.amount) {
    return next(new Error("Paid amount cannot exceed total amount"));
  }

  next();
});


transactionSchema.index({ project: 1, createdBy: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ project: 1, type: 1 });
module.exports = mongoose.model("Transaction", transactionSchema);