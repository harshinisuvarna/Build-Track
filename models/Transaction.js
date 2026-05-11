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
    materialType: {
      type: String,
      enum: ["purchase", "usage", ""],
      default: "",
    },
    unit: {
      type: String,
      enum: ["kg", "bag", "sqft", "day", "hour", "unit", "ton", "MT", "truck", "ltr", "rft", ""],
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
      enum: ["Cash", "Bank", "Bank Transfer", "UPI", "Cheque", ""],
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
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    receipts: [{
      fileUrl: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
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

// Mongoose v9: use async pre-save (no next() parameter needed)
transactionSchema.pre("save", async function () {
  // Auto-calculate amount ONLY for Materials (qty × rate).
  // For Wages / Expense / Income the user enters the amount directly — do NOT overwrite it.
  if (this.type === "Materials" && this.quantity && this.rate) {
    this.amount = this.quantity * this.rate;
  }

  // Auto-calculate payment balance
  if (this.paymentStatus === "Paid") {
    this.paidAmount     = this.amount;
    this.remainingAmount = 0;
  } else if (this.paymentStatus === "Pending") {
    this.paidAmount     = 0;
    this.remainingAmount = this.amount;
  } else if (this.paymentStatus === "Partial") {
    this.remainingAmount = this.amount - (this.paidAmount || 0);
  }
});


transactionSchema.index({ project: 1, createdBy: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ project: 1, type: 1 });
module.exports = mongoose.model("Transaction", transactionSchema);
