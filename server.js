const PORT = process.env.PORT || 8000;
const express = require("express");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
require("dotenv").config();
const authenticateToken = require('./middleware/authenticateToken')
const mongoose = require("mongoose");
const connectDB = require('./config/db')
connectDB()
const stripeRoute = require('./routes/stripeRoute');
const pricingRoute = require('./routes/pricingRoute')
const mcqRoutes = require('./routes/mcqRoutes');
const cookieParser = require('cookie-parser')
const admin = require('firebase-admin');


admin.initializeApp({
  credential:admin.credential.cert({
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
  projectId: process.env.FIREBASE_PROJECT_ID
}),
databaseURL: process.env.FIREBASE_DATABASE_URL
})


const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });


const app = express();
app.use(express.json());


app.use(cookieParser());

app.use(cors({
  origin: ['https://www.educaiter.com','https://educaiter.com' ,'http://localhost:3000'], // removed the trailing slash
  credentials: true,
}));





app.options('*', cors()); // Enable preflight requests for all routes

  


app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});


const checkApiUsage = async (req, res, next) => {
    const userId = req.user?._id;
  
    // Find the user in the database
    const user = await User.findById(userId);
  
    // Check if the user has exceeded their limit
    if (user.apiUsage >= user.apiLimit) {
      return res.status(403).json({ message: "API usage limit reached. Please make a payment to continue using the service." });
    }
  
    // If not, increment the user's API usage
    user.apiUsage += 1;
    await user.save();
  
    next();
  };




app.use('/api', stripeRoute);

app.use('/api', pricingRoute);


app.get('/api/me', authenticateToken, limiter, (req, res) => {
  console.log('me')
  const { age, email, interests, learningStyle, name, picture, subjectsOfInterest, _id, subscription, username, credits } = req.user
  const { planType, sessionId } = subscription
  res.json({ age, email, interests, learningStyle, name, picture, subjectsOfInterest, planType, sessionId, _id, username, credits });
});


const apiRouter = require("./routes/api");
const userRouter = require("./routes/userRoutes");
const assessmentRoutes = require('./routes/assessmentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');




app.use('/api/assessment', assessmentRoutes);
app.use('/api/recommendation', recommendationRoutes);
app.use("/api/chat", authenticateToken, limiter, apiRouter);
app.use('/api/mcqs', mcqRoutes);
app.use("/api", userRouter);


app.get('/', (req, res) => {
  res.send('it works')
})

app.listen(PORT, () => console.log(`Your server is running on PORT ${PORT}`));