const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    syllabus: { type: String },
    chapter_from: { type: String },
    chapter_to: { type: String },
    language: { type: String },
    authorId: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    file: { type: String },
    questions: { type: [Object], default: [] }, // Supports different data structures
    answers: { type: [Object], default: [] },
    children: { type: mongoose.Schema.Types.ObjectId, ref: "Child" },
    childrenId: { type: String },
    no_of_question: { type: String },
    className: { type: String },
    url: { type: String },
    otp: { type: Number },
    topics: [{ type: String  }],
    topicLimit: { type: Number, default: 1, min: 0 },
    childLimit: { type: Number, default: 1, min: 0 },
    isExplanationGenerated: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paper", paperSchema);
