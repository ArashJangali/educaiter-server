const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

const FRONTEND_URL = process.env.FRONTEND_URL;


// nodemailer

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    }
  })
  

  // signup

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    console.log('existingUser', req.body)
    try {
      const existingUser = await User.findOne({ email });
      console.log(existingUser)
  
      if (existingUser) {
        return res.status(400).json({ error: "User already exists." });
      }

      const user = new User({ name, email, password });
      const verificationToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });
      user.verificationToken = verificationToken
      
      await user.save();
      const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: "1h" });
     
  
      let mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Email Verification',
        text: `Hello ${user.name}, Please click on the following link to verify your email: ${process.env.BASE_URL}/verify-email?token=${user.verificationToken}`,
      }    
      
      transporter.sendMail(mailOptions, function(err, data) {
        if (err) {
          console.log('Error sending email:');
        } else {
          console.log('Email sent successfully');
        }
      });
  
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' 
      }).status(200).json({ token, user });
  
    } catch (error) {
      res.status(500).json({ error: "Server error." });
    }
  };
  
    // email verification route when signing up
  
    exports.verifyEmail = async (req, res) => {
      const { token } = req.query;
      console.log(token, 'token')
  
      try {
        const decoded = jwt.verify(token, SECRET_KEY)
        console.log(decoded, 'decoded')
  
        const user = await User.findById(decoded.userId);

        console.log(user, 'user')
  
        if (!user) {
          return res.status(400).json({ error: "Invalid or expired token." });
        }
  
        if (user.verificationToken === token) {
          user.verificationToken = undefined;
          user.emailVerified = true;
          await user.save();
  
          res.redirect(302, `${FRONTEND_URL}/subscription`);
        } else {
          return res.status(400).json({ error: "Invalid or expired token." })
        }
  
      } catch(error) {
        res.status(500).json({ error: "Server error." });
      }
    }
  
  // login
  
  exports.login = async (req, res) => {
    const { email, password } = req.body;
    
  console.log(email)
    try {
      const user = await User.findOne({ email });
      console.log(user)
  
      if (!user) {
        return res.status(400).json({ error: "User not found, please sign up." });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(isMatch)
      if (!isMatch) {
        return res
          .status(400)
          .json({ error: "Incorrect password, please try again." });
      }
  
      const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: "1h" });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax' 
      })
  
  
      res.status(200).json({ token, user });
    } catch (error) {
      res.status(500).json({ error: "Server error." });
    }
  };


  // logout
  exports.logout = (req, res) => {
    console.log(req)
    res.clearCookie('token');
    return res.status(200).json({ message: "Logged out successfully." });
  };
  