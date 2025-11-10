// models/Topic.js
const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate topic titles for the same child
topicSchema.index({ title: 1, child: 1 }, { unique: true });

module.exports = mongoose.model("Topic", topicSchema);
