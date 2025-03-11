const mongoose = require("mongoose");

const childSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0 },
    grade: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete functionality
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: false, // Optional field to associate with a parent
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

childSchema.index({ name: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model("Child", childSchema);
