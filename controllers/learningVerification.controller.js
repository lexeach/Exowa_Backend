const Paper = require("../models/paper.model");
const LearningVerification = require("../models/learningVerification.model");

const {
    successResponse,
    errorResponse,
    customErrorResponse,
} = require("../utils/response.dto");

const {
    generateVerificationQuestions,
} = require("../utils/question.ai");

/**
 * ============================================================
 * Generate Verification Paper
 * ============================================================
 */

exports.generateVerification = async (req, res) => {

    try {

        const { paperId, questionNumber } = req.body;

        const userId = req.user.id;

        if (!paperId || !questionNumber) {

            return customErrorResponse(
                res,
                400,
                "paperId and questionNumber are required."
            );

        }

        //--------------------------------------------------
        // Load Paper
        //--------------------------------------------------

        const paper = await Paper.findById(paperId);

        if (!paper) {

            return customErrorResponse(
                res,
                404,
                "Paper not found."
            );

        }

        //--------------------------------------------------
        // Load Explanation
        //--------------------------------------------------

       //--------------------------------------------------
// Load Learning Resource
//--------------------------------------------------

const learning =
    await LearningVerification.findOne({

        paper: paperId,

        questionIndex: Number(questionNumber),

        createdBy: userId,

    });

if (!learning) {

    return customErrorResponse(

        res,

        404,

        "Learning resource not found."

    );

}

        //--------------------------------------------------
        // Generate Verification Questions
        //--------------------------------------------------

        const aiQuestions =
    await generateVerificationQuestions({

        originalQuestion:
            learning.originalQuestion,

        topic:
            learning.topic,

        learningObjective:
            learning.learningObjective,

        keywords:
            learning.keywords || [],

        language:
            paper.language

    });
        if (!Array.isArray(aiQuestions)) {

    return customErrorResponse(
        res,
        500,
        "AI failed to generate verification questions."
    );

}
        const questions =
            aiQuestions.map((question) => ({

                question: question.question,

                options: Object.values(question.choices),

                correctAnswer: question.correctAnswer,

                selectedAnswer: "",

                isCorrect: false,

            }));

        //--------------------------------------------------
        // Find Existing Verification
        //--------------------------------------------------

        let verification =
            await LearningVerification.findOne({

                paper: paperId,

                questionIndex: Number(questionNumber),

                createdBy: userId,

            });

        //--------------------------------------------------
        // Existing Record
        //--------------------------------------------------

       if (verification) {

    // If already completed, don't regenerate.
    if (verification.status === "Completed") {
        return successResponse(
            res,
            200,
            "Verification already completed.",
            verification
        );
    }

    // Only regenerate if still pending
    verification.questions = questions;

verification.learningContent =
    learning.learningContent || "";

verification.topic =
    learning.topic || "";

verification.learningObjective =
    learning.learningObjective || "";

verification.keywords =
    learning.keywords || [];

verification.videos =
    learning.videos || [];

verification.pdfs =
    learning.pdfs || [];

verification.totalQuestions = questions.length;

verification.score = 0;

verification.scorePercentage = 0;

verification.submittedAt = null;

verification.verifiedAt = null;

verification.lastAttemptAt = new Date();

verification.attempts += 1;

verification.attemptHistory = [];

verification.status = "Pending";
    await verification.save();
}

        //--------------------------------------------------
        // Create New
        //--------------------------------------------------

        else {

            verification =
    await LearningVerification.create({

        paper: paperId,

        questionIndex:
            Number(questionNumber),

        originalQuestion:
            learning.originalQuestion,

        learningContent:
            learning.learningContent || "",

        topic:
            learning.topic || "",

        learningObjective:
            learning.learningObjective || "",

        keywords:
            learning.keywords || [],

        videos:
            learning.videos || [],

        pdfs:
            learning.pdfs || [],

        questions,

        score: 0,

        totalQuestions:
            questions.length,

        scorePercentage: 0,

        status: "Pending",

        attempts: 1,

        createdBy: userId

    });

        }

        //--------------------------------------------------

        return successResponse(

            res,

            200,

            "Verification paper generated successfully.",

            verification

        );

    }

    catch (error) {

        

        console.error("Message :", error.message);

console.error(error.stack);

        return errorResponse(res, error);

    }

};

/**
 * ============================================================
 * Submit Verification
 * ============================================================
 */

exports.submitVerification = async (req, res) => {

    try {

        const { verificationId, answers } = req.body;

        const userId = req.user.id;

        if (!verificationId) {

            return customErrorResponse(
                res,
                400,
                "verificationId is required."
            );

        }

        if (!Array.isArray(answers)) {

            return customErrorResponse(
                res,
                400,
                "answers must be an array."
            );

        }

        //--------------------------------------------------
        // Load Verification
        //--------------------------------------------------

        const verification =
            await LearningVerification.findOne({

                _id: verificationId,

                createdBy: userId,

            });

        if (!verification) {

            return customErrorResponse(
                res,
                404,
                "Verification not found."
            );

        }

        //--------------------------------------------------
        // Evaluate Answers
        //--------------------------------------------------

        let score = 0;

        verification.questions =
            verification.questions.map((question, index) => {

                const selectedAnswer =
                    answers[index] || "";

                const isCorrect =
                    selectedAnswer ===
                    question.correctAnswer;

                if (isCorrect) {
                    score++;
                }

                return {

                    ...question.toObject(),

                    selectedAnswer,

                    isCorrect,

                };

            });

        //--------------------------------------------------
        // Score
        //--------------------------------------------------

        verification.score = score;

        verification.totalQuestions =
            verification.questions.length;

        verification.scorePercentage =
            verification.totalQuestions > 0
                ? Math.round(
                      (score /
                          verification.totalQuestions) *
                          100
                  )
                : 0;

        verification.submittedAt =
            new Date();

       // Status
//--------------------------------------------------

if (
    verification.score ===
    verification.totalQuestions
) {

    verification.status = "Completed";
    verification.verifiedAt = new Date();

} else {

    verification.status = "Pending";
    verification.verifiedAt = null;

}

// Save verification FIRST


//--------------------------------------------------
// Check if any pending verification exists
//--------------------------------------------------

        //--------------------------------------------------
        // Attempt History
        //--------------------------------------------------

        verification.attemptHistory.push({

    attemptNo:
        verification.attempts,

    score:
        verification.score,

    scorePercentage:
        verification.scorePercentage,

    submittedAt:
        new Date(),

});

await verification.save();
        const pendingVerification =
    await LearningVerification.findOne({

        paper: verification.paper,

        createdBy: userId,

        status: "Pending",

    });

    //--------------------------------------------------
    // Update Paper Status
    //--------------------------------------------------

    if (!pendingVerification) {

    await Paper.findByIdAndUpdate(
        verification.paper,
        {
            paperStatus: "Completed",
        }
    );

     } else {

    await Paper.findByIdAndUpdate(
        verification.paper,
        {
            paperStatus: "Pending",
        }
    );

    }


        //--------------------------------------------------

        return successResponse(

            res,

            200,

            "Verification submitted successfully.",

            {

                _id: verification._id,

                score:
                    verification.score,

                totalQuestions:
                    verification.totalQuestions,

                scorePercentage:
                    verification.scorePercentage,

                status:
                    verification.status,

            }

        );

    }

    catch (error) {

        console.error("Message :", error.message);

console.error(error.stack);

        return errorResponse(res, error);

    }

};

/**
 * ============================================================
 * Get Verification Status
 * ============================================================
 */


exports.getVerificationStatus = async (req, res) => {

    try {

        const { paperId, questionNumber } = req.params;

        const userId = req.user.id;

        const verification =
            await LearningVerification.findOne({

                paper: paperId,

                questionIndex: Number(questionNumber),

                createdBy: userId,

            });

        if (!verification) {

            return successResponse(

                res,

                200,

                "Verification not found.",

                {

                    status: "Pending",

                    completed: false,

                }

            );

        }

        return successResponse(

            res,

            200,

            "Verification status fetched successfully.",

            {

                _id: verification._id,

                paper: verification.paper,

                questionIndex: verification.questionIndex,

                score: verification.score,

                totalQuestions:
                    verification.totalQuestions,

                scorePercentage:
                    verification.scorePercentage,

                status: verification.status,

                attempts: verification.attempts,

                submittedAt: verification.submittedAt,

                verifiedAt: verification.verifiedAt,

            }

        );

    }

    catch (error) {

       console.error("Message :", error.message);

console.error(error.stack);

        return errorResponse(res, error);

    }

};
