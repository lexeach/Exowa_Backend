const Paper = require("../models/paper.model");
const QuestionExplanation = require("../models/questionExplanation.model");
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

        const explanationDoc =
            await QuestionExplanation.findOne({

                questionId: paperId,

                isDeleted: false,

            });

        if (!explanationDoc) {

            return customErrorResponse(
                res,
                404,
                "Learning content not generated yet."
            );

        }

        const explanation =
            explanationDoc.explanations.find(

                item =>
                    Number(item.questionNumber) ===
                    Number(questionNumber)

            );

        if (!explanation) {

            return customErrorResponse(
                res,
                404,
                "Learning content not found."
            );

        }

        //--------------------------------------------------
        // Generate Verification Questions
        //--------------------------------------------------

        const aiQuestions =
            await generateVerificationQuestions({

                explanation: explanation.explanation,

                language: paper.language,

            });

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

            verification.questions = questions;

            verification.learningContent =
                explanation.explanation;

            verification.score = 0;

            verification.scorePercentage = 0;

            verification.status = "Pending";

            verification.submittedAt = null;

            verification.verifiedAt = null;

            verification.lastAttemptAt = new Date();

            verification.attempts += 1;

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
                        paper.questions.find(

                            q =>
                                Number(q.questionNumber) ===
                                Number(questionNumber)

                        ),

                    learningContent:
                        explanation.explanation,

                    questions,

                    totalQuestions:
                        questions.length,

                    createdBy: userId,

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

        console.error(error);

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

        //--------------------------------------------------
        // Status
        //--------------------------------------------------

        if (
            verification.score ===
            verification.totalQuestions
        ) {

            verification.status =
                "Completed";

            verification.verifiedAt =
                new Date();

            //--------------------------------------------------
            // Update Original Paper Status
            //--------------------------------------------------

            await Paper.findByIdAndUpdate(
                verification.paper,
                {
                    paperStatus: "Completed",
                }
            );

        } else {

            verification.status =
                "Pending";

        }

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

        console.error(error);

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

        console.error(error);

        return errorResponse(res, error);

    }

};
