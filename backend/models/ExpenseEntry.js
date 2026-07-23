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

        floor: { type: String, trim: true },
        mainStage: { type: String, trim: true },
        subStage: { type: String, trim: true },
        activity: { type: String, trim: true },

        entryType: {
            type: String,
            enum: ["Material", "Labour", "Equipment", "Misc"],
            required: true
        },
        itemName: { type: String, required: true },
        vendorName: { type: String },

        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String },
        ratePerUnit: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },

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
        paymentReference: { type: String },

        invoiceAttachment: { type: String },
        paymentReceiptAttachment: { type: String },
        photoAttachment: { type: String },

        remarks: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ExpenseEntry", expenseEntrySchema);
