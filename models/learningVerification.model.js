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

    // Student Selected Answer
    selectedAnswer: {
      type: String,
      default: "",
    },

    // Correct / Incorrect
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const attemptHistorySchema = new mongoose.Schema(
  {
    attemptNo: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    scorePercentage: {
      type: Number,
      default: 0,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
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

    // Original Wrong Question Number
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

    // Generated Verification Questions
    questions: {
      type: [verificationQuestionSchema],
      default: [],
    },

    // Correct Answers Count
    score: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 3,
    },

    // Percentage
    scorePercentage: {
      type: Number,
      default: 0,
    },

    // Pending / Completed
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    // Number of verification attempts
    attempts: {
      type: Number,
      default: 1,
    },

    // Last submission time
    submittedAt: {
      type: Date,
      default: null,
    },

    // Last attempt generated
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },

    // Mastery achieved
    verifiedAt: {
      type: Date,
      default: null,
    },

    // Future Analytics
    attemptHistory: {
      type: [attemptHistorySchema],
      default: [],
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
