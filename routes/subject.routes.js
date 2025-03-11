// routes/subject.routes.js
const express = require("express");
const {
  createSubject,
  getSubjects,
  showSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subject.controller");
const { auth, adminAuth } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: API for managing subjects
 */

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject
 *     description: Create a subject record with the specified fields.
 *     tags:
 *       - Subjects
 *     security:
 *       - bearerAuth: [] # JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mathematics"
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Subject created successfully
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
 *                   example: Subject created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1234567890abcdef"
 *                     name:
 *                       type: string
 *                       example: "Mathematics"
 *                     ownerId:
 *                       type: string
 *                       example: "0987654321fedcba"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Subject with same name already exists
 */
router.post("/", auth, adminAuth,createSubject);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Retrieve a list of subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for subject name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "641e6d5f334b8b00278e3d45"
 *                       name:
 *                         type: string
 *                         example: "Mathematics"
 *                       ownerId:
 *                         type: string
 *                         example: "0987654321fedcba"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     last_page:
 *                       type: integer
 *                     from:
 *                       type: integer
 *                     to:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth,  getSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get a single subject by ID
 *     description: Retrieve a single subject by its unique identifier.
 *     tags:
 *       - Subjects
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
 *         description: Successfully fetched the subject
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     ownerId:
 *                       type: string
 *       404:
 *         description: Subject not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", auth, adminAuth, showSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     summary: Update an existing subject
 *     description: Update a subject's details.
 *     tags:
 *       - Subjects
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *                 example: "Advanced Mathematics"
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subject not found
 *       409:
 *         description: Subject with same name already exists
 */
router.put("/:id", auth, adminAuth, updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete a subject by ID
 *     description: Soft delete a subject by setting isDeleted to true
 *     tags: [Subjects]
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
 *         description: Subject deleted successfully
 *       404:
 *         description: Subject not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", auth, adminAuth, deleteSubject);

module.exports = router;