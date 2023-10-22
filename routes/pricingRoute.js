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
    "id": "price_1O31ELEZSzawTl75SrV8SvmM",
    "name": "Bronze",
    "description": "Chat conversations with AI. Tailored assessments. Personalized strength and weakness analysis. Custom-fit suggestions. Limited recommendations, flashcards, and test questions. Limited chat history analysis. No hidden charges, cancel anytime.",
    "price": 0,
  },
  {
    "id": "price_1O31KOEZSzawTl75T7fG36nH",
    "name": "Silver Monthly",
    "description": "Includes all Basic tier features plus unlimited recommendations, extensive flashcards, in-depth chat history analysis, unlimited test questions, and more. No hidden charges, cancel anytime.",
    "price": 14.99,
    "duration": "monthly"
  },
  {
    "id": "price_1O31KOEZSzawTl75GPbYU7LH",
    "name": "Silver Annual",
    "description": "Includes all Basic tier features plus unlimited recommendations, extensive flashcards, in-depth chat history analysis, unlimited test questions, and more. No hidden charges, cancel anytime.",
    "price": 119.88,
    "duration": "yearly"
  },
  {
    "id": "price_1O31MMEZSzawTl75AvWyAL2F",
    "name": "Gold Monthly",
    "description": "Includes all Basic tier features plus unlimited recommendations, extensive flashcards, in-depth chat history analysis, unlimited test questions, and more. No hidden charges, cancel anytime.",
    "price": 19.99,
    "duration": "monthly"
  },
  {
    "id": "price_1O31MMEZSzawTl75xMRVDacx",
    "name": "Gold Annual",
    "description": "Includes all Basic tier features plus unlimited recommendations, extensive flashcards, in-depth chat history analysis, unlimited test questions, and more. No hidden charges, cancel anytime.",
    "price": 179.88,
    "duration": "yearly"
  },
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
