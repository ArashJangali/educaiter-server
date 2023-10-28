const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const {
  getAssessmentsByUserId,
  generateQuestion,
  evaluateAnswer,
  lineChart,
} = require("../controllers/assessmentController");
const authenticateToken = require("../middleware/authenticateToken");
const userIdValidation = require("../middleware/userIdValidation");
const {
  checkSubscriptionExists,
  usageLimit,
} = require("../middleware/checkSubscription");
const User = require("../models/userModel");

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

router.get(
  "/generateQuestion/:topic/:level",
  check("topic").isIn([
    "Software Development",
    "Web Development",
    "Mobile App Development",
    "Data Science & Analytics",
    "Machine Learning & AI",
    "Cloud Computing & DevOps",
    "Cybersecurity",
    "Mathematics",
    "Blockchain & Cryptocurrency",
    "Quantum Computing",
    "Augmented & Virtual Reality (AR/VR)",
    "Internet of Things (IoT)",
  ]),
  check("level").isIn([
    "Foundational",
    "Undergraduate",
    "Postgraduate",
    "Doctorate",
    "Researcher",
    "Expert",
    "Master",
    "Visionary",
  ]),
  authenticateToken,
  limiter,
  usageLimit,
  generateQuestion
);

router.post(
  "/evaluateAnswer/:topic/:level",
  check("topic").isIn([
    "Software Development",
    "Web Development",
    "Mobile App Development",
    "Data Science & Analytics",
    "Machine Learning & AI",
    "Cloud Computing & DevOps",
    "Cybersecurity",
    "Mathematics",
    "Blockchain & Cryptocurrency",
    "Quantum Computing",
    "Augmented & Virtual Reality (AR/VR)",
    "Internet of Things (IoT)",
  ]),
  check("level").isIn([
    "Foundational",
    "Undergraduate",
    "Postgraduate",
    "Doctorate",
    "Researcher",
    "Expert",
    "Master",
    "Visionary",
  ]),
  authenticateToken,
  limiter,
  usageLimit,
  evaluateAnswer
);

router.get(
  "/:userId",
  authenticateToken,
  limiter,
  userIdValidation,
  getAssessmentsByUserId
);

router.get(
  "/linechart/:userId",
  authenticateToken,
  limiter,
  userIdValidation,
  lineChart
);

module.exports = router;
