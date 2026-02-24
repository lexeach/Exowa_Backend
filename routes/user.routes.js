const express = require("express");
const { register, login } = require("../controllers/user.controller");
const { getChildrenLogin } = require("../controllers/paper.controller");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Name of the user
 *         email:
 *           type: string
 *           description: Email of the user
 *         password:
 *           type: string
 *           description: Password for the user
 *       example:
 *         name: Jane Doe
 *         email: jane.doe@example.com
 *         password: password123
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                 userId:
 *                   type: string
 *                   description: ID of the newly registered user
 *       400:
 *         description: Bad request
 */
router.post("/register", register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email of the user
 *               password:
 *                 type: string
 *                 description: Password of the user
 *             example:
 *               email: jane.doe@example.com
 *               password: password123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Unauthorized access
 */
router.post("/login", login);

/**
 * @swagger
 * /api/users/childLogin/{id}:
 *   post:
 *     summary: Retrieve an answer for a specific question with OTP verification
 *     description: Fetches the answer for a given question ID, parent ID, and OTP provided in the request body, with the child ID passed as a URL parameter.
 *     tags:
 *       - Answers
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the child.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentId:
 *                 type: string
 *                 description: The ID of the parent associated with the question.
 *                 example: "67890"
 *               questionId:
 *                 type: string
 *                 description: The ID of the question whose answer is to be retrieved.
 *                 example: "12345"
 *               otp:
 *                 type: string
 *                 description: The OTP for verification.
 *                 example: "987654"
 *     responses:
 *       200:
 *         description: Successfully retrieved the answer for the question.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questionId:
 *                   type: string
 *                   description: The ID of the question.
 *                   example: "12345"
 *                 parentId:
 *                   type: string
 *                   description: The ID of the parent.
 *                   example: "67890"
 *                 answer:
 *                   type: string
 *                   description: The answer for the question.
 *                   example: "This is the answer."
 *       400:
 *         description: Missing or invalid parameters in the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields or invalid OTP."
 *       404:
 *         description: Answer not found for the provided question ID and parent ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Answer not found."
 *       500:
 *         description: An error occurred on the server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while fetching the answer."
 */
router.post("/childLogin/:id", getChildrenLogin);

module.exports = router;
