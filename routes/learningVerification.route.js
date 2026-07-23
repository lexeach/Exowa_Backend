const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth.middleware");

const controller = require("../controllers/learningVerification.controller");

router.post(
    "/generate",
    auth,
    controller.generateVerificationPaper
);

module.exports = router;
