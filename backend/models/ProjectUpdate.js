const mongoose = require("mongoose");

const projectUpdateSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    stage: {
      type: String,
      enum: [
        "Foundation",
        "Footing",
        "Walls",
        "Slab",
        "First Floor",
        "Second Floor",
        "Finishing",
      ],
      required: true,
    },
    workDone: Number, // sqft
    startDate: Date,
    endDate: Date,
    media: [String], // URLs/filenames for photos/videos
    remarks: String,
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
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
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectUpdate", projectUpdateSchema);
