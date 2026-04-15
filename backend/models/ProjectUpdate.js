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
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectUpdate", projectUpdateSchema);
