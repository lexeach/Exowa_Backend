const express = require("express");
const {
  createChild,
  getChildren,
  showChild,
  updateChild,
  deleteChild,
  getClassList,
} = require("../controllers/child.controller");
const { auth } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Children
 *   description: API for managing children
 */

/**
 * @swagger
 * /api/children:
 *   post:
 *     summary: Create a new child
 *     description: Create a child record with the specified fields.
 *     tags:
 *       - Children
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
 *                 example: "John Doe"
 *               age:
 *                 type: number
 *                 example: 10
 *               grade:
 *                 type: string
 *                 example: "5th Grade"
 *             required:
 *               - name
 *               - age
 *               - grade
 *     responses:
 *       201:
 *         description: Child created successfully
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
 *                   example: Child created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1234567890abcdef"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     age:
 *                       type: number
 *                       example: 10
 *                     grade:
 *                       type: string
 *                       example: "5th Grade"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth, createChild);

/**
 * @swagger
 * /api/children:
 *   get:
 *     summary: Retrieve a list of children
 *     tags: [Children]
 *     responses:
 *       200:
 *         description: List of children
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
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   age:
 *                     type: number
 *                     example: 10
 *                   grade:
 *                     type: string
 *                     example: "5th Grade"
 */
router.get("/", auth, getChildren);

/**
 * @swagger
 * /api/children/{id}:
 *   get:
 *     summary: Get a single child by ID
 *     description: Retrieve a single child by its unique identifier.
 *     tags:
 *       - Children
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched the child
 *       404:
 *         description: Child not found
 */
router.get("/:id", auth, showChild);

/**
 * @swagger
 * /api/children/{id}:
 *   put:
 *     summary: Update an existing child
 *     description: Update a child's details.
 *     tags:
 *       - Children
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
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               age:
 *                 type: number
 *                 example: 12
 *               grade:
 *                 type: string
 *                 example: "6th Grade"
 *             required:
 *               - name
 *               - age
 *               - grade
 *     responses:
 *       200:
 *         description: Child updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", auth, updateChild);

/**
 * @swagger
 * /api/children/{id}:
 *   delete:
 *     summary: Delete a child by ID
 *     tags: [Children]
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
 *         description: Child deleted successfully
 *       404:
 *         description: Child not found
 */
router.delete("/:id", auth, deleteChild);

/**
 * @swagger
 * /api/children/classes/list:
 *   get:
 *     summary: Get class list based on user role
 *     description: Returns grades/classes based on authenticated user. Admin gets all grades, parents get grades from their children, children get their own grade.
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class list retrieved successfully
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
 *                   example: Grades retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     grades:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["5", "6", "7", "8"]
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.get("/classes/list", auth, getClassList);

module.exports = router;
