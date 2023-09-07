const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const authenticateToken = require('../middleware/authenticateToken')
const bodyParser = require('body-parser');


const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });

// Route for creating subscription
router.post('/create-checkout-session', authenticateToken, limiter, stripeController.createSubscription);
router.post('/payment-success', authenticateToken, limiter, stripeController.paymentSuccess);
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), stripeController.handleWebhooks);

router.delete('/deletedSubscription', authenticateToken, limiter, stripeController.deletedSubscription);

module.exports = router;

