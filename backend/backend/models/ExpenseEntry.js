const mongoose = require("mongoose");

const expenseEntrySchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Categorization
        floor: { type: String, trim: true },
        mainStage: { type: String, trim: true },
        subStage: { type: String, trim: true },
        activity: { type: String, trim: true },

        // Core Expense Data
        entryType: {
            type: String,
            enum: ["Material", "Labour", "Equipment", "Misc"],
            required: true
        },
        itemName: { type: String, required: true },
        vendorName: { type: String },

        // Math
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String },
        ratePerUnit: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 }, // Auto-calculated by frontend/controller

        // Billing & Payment
        purchaseDate: { type: Date, required: true },
        invoiceNumber: { type: String },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Partial", "Paid"],
            default: "Pending"
        },
        paymentDate: { type: Date },
        paymentMode: {
            type: String,
            enum: ["Cash", "UPI", "Bank", "Bank Transfer", "Cheque", "Card", ""]
        },
        paymentReference: { type: String }, // UTR or Cheque No

        // Attachments (URLs from Cloudinary/AWS)
        invoiceAttachment: { type: String },
        paymentReceiptAttachment: { type: String },
        photoAttachment: { type: String },

        remarks: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ExpenseEntry", expenseEntrySchema);