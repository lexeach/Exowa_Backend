const express = require("express");
const router = express.Router();

const {
  auth,
} = require("../middleware/auth");

const controller = require("../controllers/learningVerification.controller");

router.post(
  "/generate",
  auth,
  controller.generateVerification
);

router.post(
  "/submit",
  auth,
  controller.submitVerification
);

router.get(
  "/:paperId/:questionNumber",
  auth,
  controller.getVerificationStatus
);

module.exports = router;
