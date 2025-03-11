// routes/syllabus.routes.js
const express = require("express");
const {
  createSyllabus,
  getSyllabuses,
  showSyllabus,
  updateSyllabus,
  deleteSyllabus,
} = require("../controllers/syllabus.controller");
const { auth, adminAuth } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Syllabuses
 *   description: API for managing syllabuses
 */

/**
 * @swagger
 * /api/syllabuses:
 *   post:
 *     summary: Create a new syllabus
 *     description: Create a syllabus record with the specified fields.
 *     tags:
 *       - Syllabuses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Grade 10 Curriculum"
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Syllabus created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Syllabus with same name already exists
 */
router.post("/", auth, adminAuth, createSyllabus);

/**
 * @swagger
 * /api/syllabuses:
 *   get:
 *     summary: Retrieve a list of syllabuses
 *     tags: [Syllabuses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of syllabuses
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth, getSyllabuses);

/**
 * @swagger
 * /api/syllabuses/{id}:
 *   get:
 *     summary: Get a single syllabus by ID
 *     description: Retrieve a single syllabus by its unique identifier.
 *     tags:
 *       - Syllabuses
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
 *         description: Successfully fetched the syllabus
 *       404:
 *         description: Syllabus not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", auth, adminAuth, showSyllabus);

/**
 * @swagger
 * /api/syllabuses/{id}:
 *   put:
 *     summary: Update an existing syllabus
 *     description: Update a syllabus's details.
 *     tags:
 *       - Syllabuses
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
 *                 example: "Updated Grade 10 Curriculum"
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Syllabus updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Syllabus not found
 *       409:
 *         description: Syllabus with same name already exists
 */
router.put("/:id", auth, adminAuth, updateSyllabus);

/**
 * @swagger
 * /api/syllabuses/{id}:
 *   delete:
 *     summary: Delete a syllabus by ID
 *     description: Soft delete a syllabus by setting isDeleted to true
 *     tags: [Syllabuses]
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
 *         description: Syllabus deleted successfully
 *       404:
 *         description: Syllabus not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", auth, adminAuth, deleteSyllabus);

module.exports = router;