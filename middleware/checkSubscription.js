const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

async function checkSubscriptionExists(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.sendStatus(401); // Unauthorized if no token

  try {
    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decodedPayload._id);

    if (!user) return res.sendStatus(403); // Forbidden if user doesn't exist

    if (
      !user.subscription.planType ||
      user.subscription.planType === "unsubscribed"
    ) {
      return res
        .status(403)
        .send({ message: "Please select a subscription plan to access this resource." });
    }

    if (
      user.subscriptionExpiryDate &&
      new Date(user.subscriptionExpiryDate) < new Date()
    ) {
      return res.status(403).send({ message: "Your subscription has expired. Please renew to continue." });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
}

async function usageLimit(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decodedPayload._id);

    const limits = {
      basic: 200,
      premium: 1000,
    };

    if (user.usageCount >= limits[user.subscription.planType]) {
      return res.status(403).send({message: "Usage limit reached. Please upgrade."});
    }

    user.usageCount += 1;
    await user.save();

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
}

async function usageLimitImageAnalysis(req, res, next) {
  try {
    // Extract the user from the token or other means
    const token = req.cookies.token;
    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decodedPayload._id);

    const limits = {
      basic: 200,
      premium: 500,
    };

    // Check if the user has exceeded their limit
    if (user.usageCount >= limits[user.subscription.planType]) {
      return res
        .status(403)
        .send({message: "Usage limit reached. Please upgrade."});
    }

    user.usageCount += 1;
    await user.save();

    // If everything is fine, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  checkSubscriptionExists,
  usageLimit,
  usageLimitImageAnalysis,
};
