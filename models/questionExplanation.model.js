const mongoose = require("mongoose");

const verificationQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },
    choices: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true }
    },
    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true
    }
  },
  { _id: false }
);

const explanationSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
      required: true
    },

    // Existing field (DO NOT CHANGE)
    explanation: {
      type: String,
      required: true
    },

    // ------------------------------
    // New fields (Backward Compatible)
    // ------------------------------

    summary: {
      type: String,
      default: ""
    },

    learningObjective: {
      type: String,
      default: ""
    },

    keyConcepts: {
      type: [String],
      default: []
    },

    verificationQuestions: {
      type: [verificationQuestionSchema],
      default: []
    },

    // Existing field (unchanged)
    references: {
      videos: {
        type: [String],
        default: []
      },
      articles: {
        type: [String],
        default: []
      },
      books: {
        type: [String],
        default: []
      }
    },

    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const questionExplanationSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
      unique: true
    },

    explanations: {
      type: [explanationSchema],
      default: []
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "QuestionExplanation",
  questionExplanationSchema
);
