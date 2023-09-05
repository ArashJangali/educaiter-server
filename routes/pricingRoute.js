const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken')
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Define your tiers
const tiers = [
  {
    "id": "price_1NilrWEZSzawTl7566rWrDUE",
    "name": "Basic",
    "description": "Chat conversations with AI. Tailored assessments. Personalized strength and weakness analysis. Custom-fit suggestions. Limited recommendations, flashcards, and test questions. Limited chat history analysis. No hidden charges, cancel anytime.",
    "price": 9.99,
  },
  {
    "id": "price_1NilrWEZSzawTl75Ky3gBKyP",
    "name": "Premium",
    "description": "Includes all Basic tier features plus unlimited recommendations, extensive flashcards, in-depth chat history analysis, unlimited test questions, and more. No hidden charges, cancel anytime.",
    "price": 19.99,
  }
];

router.get('/pricing', authenticateToken, limiter, (req, res) => {
  try {
    res.json(tiers);
  } catch(error) {
    console.error(error);
    res.status(500).json({ errorCode: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching pricing information' });
  }
});

module.exports = router;
