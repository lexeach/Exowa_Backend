const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false }, // Soft delete functionality
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

subjectSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
