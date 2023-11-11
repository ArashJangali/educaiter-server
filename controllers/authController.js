const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const admin = require('firebase-admin');
const FRONTEND_URL = process.env.FRONTEND_URL;


// nodemailer

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    }
  })
  

  // contact

  exports.contact = async (req, res) => {
    const { subject, email, description } = req.body;
    console.log(email)
    try {
      let mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: subject,
        text: `From: ${email} - Description: ${description}`,
      };

      transporter.sendMail(mailOptions, function (err) {
        console.log(err);
      });
      res.status(200).json();
    } catch (error) {
      res.status(500).json({ message: "Oops! Something went wrong. Please try again later."
    });
    }
  };

  // Firebase auth

  exports.socialAuth = async (req, res) => {
    const idToken = req.body.token || req.headers.authorization

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      const uid = decodedToken.uid
      
      let user = await User.findOne({ firebaseId: uid })
      console.log("decodedToken.email:", decodedToken.email)
      if (!user) {
        const existingUserByEmail = await User.findOne({ email: decodedToken.email })
        if (existingUserByEmail) {
          res.status(400).json({ error: "Email already in use." })
        }

        user = new User({
          oAuth: true,
          firebaseId: uid,
          subscription: { planType: "unsubscribed" },
          credits: 500,
          email: decodedToken.email,
          name: decodedToken.name,
        })
        await user.save();
      } else {
        user.oAuth = true
        await user.save()
      }
    
    
      const isProduction = process.env.NODE_ENV === 'production'

      const token = jwt.sign({ _id: user._id.toString()}, SECRET_KEY, {expiresIn: '1h'})

      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax', 
        domain: isProduction ? 'api.educaiter.com' : undefined, 
        path: '/', 
      }).status(200).json({token, user})
    } catch(error) {
      console.error('Error during social authentication:', error);
      res.status(500).json({ error: "Internal server error." });
    }
  }


  // signup

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });

  
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
        text: `Hello ${user.name}, Please click on the following link to verify your email: ${process.env.BASE_URL}/api/verify-email?token=${user.verificationToken}`,
      }    
      
      transporter.sendMail(mailOptions, function(err, data) {
        if (err) {
          console.log('Error sending email:');
        } else {
          console.log('Email sent successfully');
        }
      });

      const isProduction = process.env.NODE_ENV === 'production'

      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax', 
        domain: isProduction ? 'api.educaiter.com' : undefined, 
        path: '/', })
        .status(200).json({ token, user });
  
    } catch (error) {
      console.error('Error during signup:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: "Server error." });
    }
  };
  
    // email verification route when signing up
  
    exports.verifyEmail = async (req, res) => {
      const { token } = req.query;

  
      try {
        const decoded = jwt.verify(token, SECRET_KEY)
  
        const user = await User.findById(decoded.userId);

        if (!user) {
          return res.status(400).json({ error: "Invalid or expired token." });
        }
  
        if (user.verificationToken === token) {
          user.verificationToken = undefined;
          user.emailVerified = true;
          user.oAuth = false
          user.subscription.planType = "unsubscribed"
          user.credits = 500;
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

    try {
      const user = await User.findOne({ email });
   
  
      if (!user) {
        return res.status(400).json({ error: "User not found, please sign up." });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
   
      if (!isMatch) {
        return res
          .status(400)
          .json({ error: "Incorrect password, please try again." });
      }
  
      const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: "1h" });

    
      const isProduction = process.env.NODE_ENV === 'production'

      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax', 
        domain: isProduction ? 'api.educaiter.com' : undefined, 
        path: '/', 
      })
  
      res.status(200).json({ token, user });
    } catch (error) {
      res.status(500).json({ error: "Server error." });
    }
  };


  // logout
  exports.logout = (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({ message: "Logged out successfully." });
  };
  


  // delete account

  exports.deleteaccount = async (req, res) => {
    try {
     
      const deletedUser = await User.findByIdAndDelete(req.user._id)

      if (deletedUser) {
        res.status(200).send({ msg: 'User account deleted successfully' });
      } else {
        res.status(404).send({ msg: 'User not found' });
      }

    } catch(error) {
      console.log(error)
      res.status(500).send('An error occurred while deleting the account.')
    }
  }


  // forgot password

  exports.resetPassword = async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });

      const verificationToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });
      user.verificationToken = verificationToken
      
      await user.save();
     

      let mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Password Reset',
        text: `Hello ${user.name}, Please click on the following link to reset your email: ${process.env.FRONTEND_URL}/reset-password/${user.verificationToken}`,
      }    
      
      transporter.sendMail(mailOptions, function(err, data) {
        if (err) {
          console.log('Error sending email:');
        } else {
          console.log('Email sent successfully');
        }
      });

      if (!user) {
        return res.status(400).json({ error: "User not found, please sign up." });
      }

  
      res.status(200).json({ message: 'Email sent'});
    } catch (error) {
      res.status(500).json({ error: "Server error." });
    }
  }


  // Password change req

  exports.passwordChange = async (req, res) => {
    const { token, newPass } = req.body;
    const user = await User.findOne({
      verificationToken: token
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    user.password = newPass;  // hashing should be handled by the pre-save hook
  await user.save();

  user.verificationToken = undefined
  await user.save();

  res.status(200).json({ message: "Password successfully reset." });
  
  }