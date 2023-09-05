const express = require('express');
const router = express.Router();
// const { getLearningPathByUserId } = require('../controllers/resourceController');
const { getRecommendation, getFlashcards } = require('../controllers/recommendationController')
const authenticateToken = require('../middleware/authenticateToken')
const userIdValidation = require('../middleware/userIdValidation')
const { checkSubscriptionExists, usageLimit } = require('../middleware/checkSubscription')
const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });




// router.get('/resources/:userId', getResourcesByUserId);
// router.get('/learningpath/:userId', authenticateToken, getLearningPathByUserId);
router.get('/get-recommendation/:userId', authenticateToken, limiter, userIdValidation, checkSubscriptionExists, usageLimit, getRecommendation)



router.get('/get-flashcards/:userId', authenticateToken, limiter, userIdValidation, checkSubscriptionExists, usageLimit, getFlashcards)




module.exports = router;
