const mongoose = require("mongoose");

const toObjectIdOrNull = function (value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "object" && value?._id) {
    value = value._id;
  }

  return mongoose.Types.ObjectId.isValid(value)
    ? value
    : null;
};

const transactionSchema = new mongoose.Schema(
  {
    // ======================================================
    // OWNER
    // ======================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ======================================================
    // BASIC INFO
    // ======================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    brand: {
      type: String,
      trim: true,
    },

    // ======================================================
    // MATERIAL SUB TYPES
    // ======================================================

    subType: {
      type: String,

      enum: [
        "Purchase",
        "Consumption",

        "cement",
        "brick",
        "stone",
        "sand",
        "steel",
        "paint",
        "electrical",
        "plumbing",

        "",
      ],

      default: "",
    },

    materialType: {
      type: String,

      enum: [
        "purchase",
        "usage",
        "",
      ],

      default: "",
    },

    // ======================================================
    // UNITS
    // ======================================================

    unit: {
      type: String,

      enum: [
        "kg",
        "bag",
        "sqft",
        "sqm",
        "day",
        "hour",
        "unit",
        "ton",
        "MT",
        "truck",
        "ltr",
        "rft",
        "",
      ],

      default: "unit",
    },

    // ======================================================
    // QUANTITY & RATE
    // ======================================================

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

    // ======================================================
    // OPTIONAL ANALYTICS FIELDS
    // ======================================================

    sqftArea: {
      type: Number,
      default: 0,
    },

    floor: {
      type: String,
      trim: true,
    },

    phase: {
      type: String,
      trim: true,
    },

    // ======================================================
    // AUTO CALCULATED
    // ======================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================================
    // TRANSACTION TYPE
    // ======================================================

    type: {
      type: String,

      enum: [
        "Wages",
        "Expense",
        "Income",
        "Materials",
        "Equipment",
      ],

      required: true,
    },

    // ======================================================
    // RELATIONS
    // ======================================================

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

    // ======================================================
    // DATE
    // ======================================================

    date: {
      type: Date,
      default: Date.now,
    },

    // ======================================================
    // PAYMENT TRACKING
    // ======================================================

    paymentStatus: {
      type: String,

      enum: [
        "Paid",
        "Partial",
        "Pending",
        "",
      ],

      default: "Pending",
    },

    paymentMode: {
      type: String,

      enum: [
        "Cash",
        "Bank",
        "Bank Transfer",
        "UPI",
        "Cheque",
        "",
      ],

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

    // ======================================================
    // APPROVAL
    // ======================================================

    approvalStatus: {
      type: String,

      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],

      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // ======================================================
    // RECEIPTS
    // ======================================================

    receipts: [
      {
        fileUrl: {
          type: String,
          required: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },

        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // ======================================================
    // NOTES
    // ======================================================

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

// ======================================================
// PRE SAVE
// ======================================================

transactionSchema.pre("save", async function () {

  // Auto amount calculation only for quantity-based entries

  if (
    ["Materials", "Equipment"].includes(this.type) &&
    this.quantity &&
    this.rate
  ) {
    this.amount = this.quantity * this.rate;
  }

  // Payment balance calculation

  if (this.paymentStatus === "Paid") {
    this.paidAmount = this.amount;
    this.remainingAmount = 0;
  }

  else if (this.paymentStatus === "Pending") {
    this.paidAmount = 0;
    this.remainingAmount = this.amount;
  }

  else if (this.paymentStatus === "Partial") {
    this.remainingAmount =
      this.amount - (this.paidAmount || 0);
  }
});

// ======================================================
// INDEXES
// ======================================================

transactionSchema.index({
  project: 1,
  createdBy: 1,
});

transactionSchema.index({
  date: -1,
});

transactionSchema.index({
  project: 1,
  type: 1,
});

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);