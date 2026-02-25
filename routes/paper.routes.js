const express = require("express");
const { body } = require("express-validator");
const {
  createPaper,
  getPapers,
  showPaper,
  updatePaper,
  deletePaper,
  questionAnswer,
  questionAssign,
  generateQuestionOTP,
  generateQuestionExplanation,
  getAllQuestionExplanations
} = require("../controllers/paper.controller");
const { auth } = require("../middleware/auth");
const { verifyOwnership } = require("../middleware/verifyOwnership");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Papers
 *   description: API for managing papers
 */

/**
 * @swagger
 * /api/papers:
 *   post:
 *     summary: Create a new paper
 *     description: Create a paper with the specified fields.
 *     tags:
 *       - Papers
 *     security:
 *       - bearerAuth: [] # JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Mathematics"
 *               syllabus:
 *                 type: string
 *                 example: "CBSE"
 *               chapter_from:
 *                 type: string
 *                 example: "Algebra"
 *               chapter_to:
 *                 type: string
 *                 example: "Geometry"
 *               language:
 *                 type: string
 *                 example: "English"
 *             required:
 *               - subject
 *               - syllabus
 *               - chapter_from
 *               - chapter_to
 *               - language
 *     responses:
 *       201:
 *         description: Paper created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Paper created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1234567890abcdef"
 *                     subject:
 *                       type: string
 *                       example: "Mathematics"
 *                     syllabus:
 *                       type: string
 *                       example: "CBSE"
 *                     chapter_from:
 *                       type: string
 *                       example: "Algebra"
 *                     chapter_to:
 *                       type: string
 *                       example: "Geometry"
 *                     language:
 *                       type: string
 *                       example: "English"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  auth,
  [
    body("subject").notEmpty().withMessage("Subject is required"),
    body("syllabus").notEmpty().withMessage("Syllabus is required"),
    body("chapter_from").notEmpty().withMessage("Starting chapter is required"),
    body("chapter_to").notEmpty().withMessage("Ending chapter is required"),
    body("language").notEmpty().withMessage("Language is required"),
  ],
  createPaper
);

/**
 * @swagger
 * /api/papers:
 *   get:
 *     summary: Retrieve a list of papers
 *     tags: [Papers]
 *     responses:
 *       200:
 *         description: List of papers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "641e6d5f334b8b00278e3d45"
 *                   subject:
 *                     type: string
 *                     example: "Mathematics"
 *                   syllabus:
 *                     type: string
 *                     example: "CBSE"
 *                   chapter_from:
 *                     type: string
 *                     example: "Algebra"
 *                   chapter_to:
 *                     type: string
 *                     example: "Geometry"
 *                   language:
 *                     type: string
 *                     example: "English"
 */
router.get("/",auth, getPapers);

/**
 * @swagger
 * /api/papers/{questionId}/explanations:
 *   get:
 *     summary: Get all explanations for a question
 *     description: Retrieves all explanations for a specific question ID, including explanations for different question numbers.
 *     tags:
 *       - Papers
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the paper to get all explanations for
 *     responses:
 *       200:
 *         description: All explanations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All explanations retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: "64dfc8f2a1234bcde5678f9a"
 *                     totalExplanations:
 *                       type: integer
 *                       example: 3
 *                     explanations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionNumber:
 *                             type: integer
 *                             example: 4
 *                           explanation:
 *                             type: string
 *                             example: "This question covers the concept of..."
 *                           references:
 *                             type: object
 *                             properties:
 *                               videos:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               articles:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               books:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                           generatedAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: No explanations found for this question
 *       500:
 *         description: Server error
 */
router.get("/:questionId/explanations", getAllQuestionExplanations);

/**
 * @swagger
 * /api/papers/{questionId}/explanation:
 *   get:
 *     summary: Generate or retrieve explanation for a question
 *     description: Generates a detailed explanation and learning resources for a specific question or entire paper using AI. If an explanation already exists, it returns the cached version.
 *     tags:
 *       - Papers
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the paper to generate explanation for
 *       - in: query
 *         name: questionNumber
 *         required: false
 *         schema:
 *           type: integer
 *         description: The specific question number within the paper. If not provided, generates explanation for the entire paper.
 *     responses:
 *       200:
 *         description: Explanation retrieved successfully (cached)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Explanation retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: "64dfc8f2a1234bcde5678f9a"
 *                     explanation:
 *                       type: string
 *                       example: "This question covers the fundamental concepts of..."
 *                     references:
 *                       type: object
 *                       properties:
 *                         videos:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Introduction to Algebra - Khan Academy", "Math Basics Tutorial"]
 *                         articles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Understanding Algebraic Expressions", "Study Guide for Chapter 1"]
 *                         books:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Mathematics for Class 8 - NCERT", "Advanced Algebra by John Doe"]
 *       201:
 *         description: Explanation generated and saved successfully (new)
 *       400:
 *         description: Question ID is required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.get("/:questionId/explanation", generateQuestionExplanation);

/**
 * @swagger
 * /api/papers/{id}:
 *   get:
 *     summary: Get a single paper by ID
 *     description: Retrieve a single paper by its unique identifier.
 *     tags:
 *       - Papers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched the paper
 *       404:
 *         description: Paper not found
 */
router.get("/:id", showPaper);

// router.get("/:id", showPaper);
/**
 * @swagger
 * /api/papers/{id}:
 *   put:
 *     summary: Update an existing paper
 *     description: Update a paper's details.
 *     tags:
 *       - Papers
 *     security:
 *       - bearerAuth: [] # JWT authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Mathematics"
 *               syllabus:
 *                 type: string
 *                 example: "CBSE"
 *               chapter_from:
 *                 type: string
 *                 example: "Algebra"
 *               chapter_to:
 *                 type: string
 *                 example: "Geometry"
 *               language:
 *                 type: string
 *                 example: "English"
 *             required:
 *               - subject
 *               - syllabus
 *               - chapter_from
 *               - chapter_to
 *               - language
 *     responses:
 *       200:
 *         description: Paper updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:id",
  auth,
  verifyOwnership,
  [
    body("subject").notEmpty().withMessage("Subject is required"),
    body("syllabus").notEmpty().withMessage("Syllabus is required"),
    body("chapter_from").notEmpty().withMessage("Starting chapter is required"),
    body("chapter_to").notEmpty().withMessage("Ending chapter is required"),
    body("language").notEmpty().withMessage("Language is required"),
  ],
  updatePaper
);

/**
 * @swagger
 * /api/papers/{id}:
 *   delete:
 *     summary: Delete a paper by ID
 *     tags: [Papers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paper deleted successfully
 *       404:
 *         description: Paper not found
 */
router.delete("/:id", auth, deletePaper);

/**
 * @swagger
 * /api/papers/answer:
 *   patch:
 *     summary: Update answers for a question
 *     description: Updates the answers for a specific question using the question ID and user ID provided in the query parameters. The request body should include the question ID, an array of answers, and an OTP for verification.
 *     tags:
 *       - Answers
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user answering the question.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: integer
 *                 description: The ID of the question being answered.
 *                 example: 1
 *               answers:
 *                 type: array
 *                 description: An array of answers provided by the user.
 *                 items:
 *                   type: object
 *                   properties:
 *                     option:
 *                       type: string
 *                       description: The option chosen by the user.
 *                       example: "A"
 *                     questionNumber:
 *                       type: integer
 *                       description: The number of the question being answered.
 *                       example: 1
 *               otp:
 *                 type: string
 *                 description: The OTP for verifying the user's identity.
 *                 example: "987654"
 *     responses:
 *       200:
 *         description: The answers were updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Answers updated successfully."
 *       400:
 *         description: Missing or invalid parameters in the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing userId in query parameters."
 *       500:
 *         description: An error occurred on the server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while updating the answers."
 */
router.patch('/answer', questionAnswer);

/**
 * @swagger
 * /api/papers/assign:
 *   post:
 *     summary: Assign a question to a child
 *     description: Assigns a question to a child by saving the child ID to the `childrenId` field of the question. If the question is already assigned, it cannot be reassigned.
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the question to assign.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               childId:
 *                 type: string
 *                 description: The ID of the child to assign to the question.
 *                 example: "64dfc8f2a1234bcde5678f9a"
 *     responses:
 *       200:
 *         description: Question successfully assigned to the child.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question assigned to the child successfully."
 *                 question:
 *                   type: object
 *                   description: The updated question object.
 *       400:
 *         description: Invalid input or question already assigned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "This question is already assigned to a child."
 *       404:
 *         description: Question not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question not found."
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while assigning the question."
 */
router.post('/assign', auth, questionAssign);

router.post("/generateQuestionOTP/:questionId", auth, generateQuestionOTP);

module.exports = router;
