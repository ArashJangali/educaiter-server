const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const { getAssessmentsByUserId, generateQuestion, evaluateAnswer, lineChart } = require('../controllers/assessmentController');
const authenticateToken = require('../middleware/authenticateToken')
const userIdValidation = require('../middleware/userIdValidation')
const { checkSubscriptionExists, usageLimit } = require('../middleware/checkSubscription')
const User = require('../models/userModel')

const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });


 



router.get('/generateQuestion/:topic/:level',
check('topic').isIn(['Computer Science', 'Mathematics', 'Design', "Digital Marketing", "Law", "Finance", "Entrepreneurship", "Accounting", "Life Science", "Physical Science", "Philosophy", "Psychology"]),
check('level').isIn(['Beginner', 'Intermediate', 'Advanced']),
authenticateToken, limiter, checkSubscriptionExists, usageLimit, generateQuestion);

router.post('/evaluateAnswer/:topic/:level',
check('topic').isIn(['Computer Science', 'Mathematics', 'Design', "Digital Marketing", "Law", "Finance", "Entrepreneurship", "Accounting", "Life Science", "Physical Science", "Philosophy", "Psychology"]),
check('level').isIn(['Beginner', 'Intermediate', 'Advanced']),
authenticateToken, limiter, checkSubscriptionExists, usageLimit, evaluateAnswer);



router.get('/:userId', authenticateToken, limiter, userIdValidation, checkSubscriptionExists, getAssessmentsByUserId);


router.get('/linechart/:userId', authenticateToken, limiter, userIdValidation, checkSubscriptionExists, lineChart);



module.exports = router;
