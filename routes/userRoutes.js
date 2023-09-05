const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken')
const userIdValidation = require('../middleware/userIdValidation')
const { checkSubscriptionExists, usageLimit } = require('../middleware/checkSubscription')
const userController = require("../controllers/userController");
const authController = require('../controllers/authController')

const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });


router.post("/signup", limiter, authController.signup);


router.post("/login", limiter, authController.login);



router.post("/logout", limiter, authController.logout);



router.get("/users/:userId", authenticateToken, limiter, userIdValidation, checkSubscriptionExists, userController.getUser);

router.put("/users/:userId", authenticateToken, limiter, userIdValidation, checkSubscriptionExists,  userController.updateUser)



router.get('/verify-email', limiter, authController.verifyEmail);




module.exports = router;