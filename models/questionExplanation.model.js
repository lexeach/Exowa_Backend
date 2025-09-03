const mongoose = require("mongoose");

const questionExplanationSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
      unique: true
    },
    explanations: [
      {
        questionNumber: {
          type: Number,
          required: true
        },
        explanation: {
          type: String,
          required: true
        },
        references: {
          videos: [{ type: String }],
          articles: [{ type: String }],
          books: [{ type: String }]
        },
        generatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionExplanation", questionExplanationSchema);
