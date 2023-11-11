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

router.post("/social-auth", limiter, authController.socialAuth)

router.post("/signup", limiter, authController.signup);

router.post("/login", limiter, authController.login);

router.post("/contact", limiter, authController.contact);

router.post("/reset-password", limiter, authController.resetPassword);

router.post('/passwordChange',limiter, authController.passwordChange)

router.post("/logout", limiter, authController.logout);

router.delete("/deleteaccount", authenticateToken, limiter, authController.deleteaccount);

router.get("/users/:userId", authenticateToken, limiter, userIdValidation, checkSubscriptionExists, userController.getUser);

router.put("/users/:userId", authenticateToken, limiter, userIdValidation, checkSubscriptionExists,  userController.updateUser)

router.put("/users/change-password/:userId", authenticateToken, limiter, userIdValidation, checkSubscriptionExists,  userController.changePass)

router.get('/verify-email', limiter, authController.verifyEmail);




module.exports = router;
