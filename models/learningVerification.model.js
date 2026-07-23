const mongoose = require("mongoose");

const verificationQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    selectedAnswer: {
      type: String,
      default: "",
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const learningVerificationSchema = new mongoose.Schema(
  {
    // Original Paper
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
    },

    // Original Question Index
    questionIndex: {
      type: Number,
      required: true,
    },

    // Original Wrong Question
    originalQuestion: {
      type: Object,
      required: true,
    },

    // AI Generated Learning Content
    learningContent: {
      type: String,
      required: true,
    },

    // Verification Questions (3 MCQs)
    questions: {
      type: [verificationQuestionSchema],
      default: [],
    },

    // Result
    score: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 3,
    },

    // Pending / Completed
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    // How many times user clicked "I Learnt"
    attempts: {
      type: Number,
      default: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LearningVerification",
  learningVerificationSchema
);
