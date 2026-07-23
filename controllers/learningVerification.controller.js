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
 * Generate Verification Paper
 */
exports.generateVerificationPaper = async (req, res) => {

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

        //----------------------------------------
        // Load Paper
        //----------------------------------------

        const paper = await Paper.findById(paperId);

        if (!paper) {
            return customErrorResponse(
                res,
                404,
                "Paper not found."
            );
        }

        //----------------------------------------
        // Load Explanation
        //----------------------------------------

        const explanationDoc = await QuestionExplanation.findOne({
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

        const explanation = explanationDoc.explanations.find(
            item => Number(item.questionNumber) === Number(questionNumber)
        );

        if (!explanation) {

            return customErrorResponse(
                res,
                404,
                "Learning content not found."
            );

        }

        //----------------------------------------
        // Generate 3 Questions
        //----------------------------------------

        const questions =
            await generateVerificationQuestions({

                explanation: explanation.explanation,

                language: paper.language,

            });

        //----------------------------------------
        // Find Existing Verification
        //----------------------------------------

        let verification =
            await LearningVerification.findOne({

                paper: paperId,

                questionIndex: Number(questionNumber),

                createdBy: userId,

            });

        //----------------------------------------
        // Update Existing
        //----------------------------------------

        if (verification) {

            verification.questions = questions;

            verification.status = "Pending";

            verification.score = 0;

            verification.attempts += 1;

            verification.learningContent =
                explanation.explanation;

            await verification.save();

        }

        //----------------------------------------
        // Create New
        //----------------------------------------

        else {

            verification =
                await LearningVerification.create({

                    paper: paperId,

                    questionIndex: Number(questionNumber),

                    originalQuestion:
                        paper.questions.find(
                            q =>
                                Number(q.questionNumber)
                                === Number(questionNumber)
                        ),

                    learningContent:
                        explanation.explanation,

                    questions,

                    createdBy: userId,

                });

        }

        //----------------------------------------

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
