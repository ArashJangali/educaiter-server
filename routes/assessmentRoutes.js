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
  "/generateQuestion/:language/:topic/:level",
  check("language").isIn([
    "JavaScript",
    "Python",
    "Java",
    "Swift",
    "Kotlin",
    "C++",
    "C%23",
    "R",
    "SQL",
    "Go",
    "Ruby",
    "PHP",
    "TypeScript",
    "MATLAB",
    "Scala",
    "Rust",
  ]),
  check("topic").isIn([
    "Software Development",
    "Web Development",
    "Mobile App Development",
    "Data Science & Analytics",
    "Machine Learning & AI",
    'Game Dev',
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
    "Intermediate",
    "Advanced",
    "Expert",
    "Master",
  ]),
  authenticateToken,
  limiter,
  usageLimit,
  generateQuestion
);

router.post(
  "/evaluateAnswer/:language/:topic/:level",
  check("language").isIn([
    "JavaScript",
    "Python",
    "Java",
    "Swift",
    "Kotlin",
    "C++",
    "C%23",
    "R",
    "SQL",
    "Go",
    "Ruby",
    "PHP",
    "TypeScript",
    "MATLAB",
    "Scala",
    "Rust",
  ]),
  check("topic").isIn([
    "Software Development",
    "Web Development",
    "Mobile App Development",
    "Data Science & Analytics",
    "Machine Learning & AI",
    'Game Dev',
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
    "Intermediate",
    "Advanced",
    "Expert",
    "Master",
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
