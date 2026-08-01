const mongoose = require("mongoose");
//----------------------------------------------------
// Save Logger
//----------------------------------------------------


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
      default: "",
    },
    //====================================================
// AI Learning Metadata
//====================================================

topic: {
    type: String,
    default: "",
},

learningObjective: {
    type: String,
    default: "",
},

keywords: {
    type: [String],
    default: [],
},
    //====================================================
// AI Explanation
//====================================================

explanation: {
    type: String,
    default: "",
},
//====================================================
// Learning Videos
//====================================================

videos: [
    {
        title: {
            type: String,
            default: "",
        },

        url: {
            type: String,
            default: "",
        },

        videoId: {
            type: String,
            default: "",
        },

        thumbnail: {
            type: String,
            default: "",
        },

        channelTitle: {
            type: String,
            default: "",
        },

        duration: {
            type: String,
            default: "",
        },
    },
],

    //====================================================
// YouTube Search Query
//====================================================

videoSearchQuery: {

    type: String,

    default: ""

},
//====================================================
// Learning PDFs
//====================================================

pdfs: [
    {
        title: {
            type: String,
            default: "",
        },

        url: {
            type: String,
            default: "",
        },

        source: {
            type: String,
            default: "",
        },
    },
],

    //====================================================
// PDF Search Query
//====================================================

pdfSearchQuery: {

    type: String,

    default: ""

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
//----------------------------------------------------
// Indexes
//----------------------------------------------------

learningVerificationSchema.index({

    paper: 1,

    questionIndex: 1

}, {

    unique: true

});

learningVerificationSchema.index({

    createdBy: 1

});

learningVerificationSchema.index({

    status: 1

});
//----------------------------------------------------
// Post Save Logger
//----------------------------------------------------

learningVerificationSchema.post(

    "save",

    function (

        error,

        doc,

        next

    ) {

        if (error) {

            console.error("\n====================================================");
            console.error("LearningVerification SAVE ERROR");
            console.error("====================================================");

            console.error("Message :");

            console.error(error.message);

            if (error.code === 11000) {

                console.error("\nDuplicate Key Error");

                console.dir(

                    error.keyValue,

                    {

                        depth: null

                    }

                );

            }

            console.error("\nDocument");

            console.dir(

                doc,

                {

                    depth: null

                }

            );

            console.error("\nStack Trace");

            console.error(error.stack);

            console.error("====================================================\n");

        }

        next(error);

    }

);
//----------------------------------------------------
// Error Logger
//----------------------------------------------------

learningVerificationSchema.post(

    "save",

    function (

        error,

        doc,

        next

    ) {

        if (error) {

            console.error("\n========================================");
            console.error("LearningVerification SAVE ERROR");
            console.error("========================================");

            console.error(error.message);

            console.error(error.stack);

            console.error("========================================\n");

        }

        next(error);

    }

);

learningVerificationSchema.pre(

    "save",

    function (next) {

        console.log("\n====================================================");
        console.log("LearningVerification PRE SAVE");
        console.log("====================================================");

        console.log("Document ID :", this._id);

        console.log("Paper :", this.paper);

        console.log("Question :", this.questionIndex);

        console.log("Topic :", this.topic);

        console.log("Learning Objective :", this.learningObjective);

        console.log("Status :", this.status);

        console.log("Created By :", this.createdBy);

        console.log("Is New :", this.isNew);

        console.log("Modified Fields :");

        console.dir(

            this.modifiedPaths(),

            {

                depth: null

            }

        );

        console.log("====================================================\n");

        next();

    }

);

module.exports = mongoose.model(
  "LearningVerification",
  learningVerificationSchema
);
