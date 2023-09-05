const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;



// GET user

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
        res.json(user)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

// UPDATE user

exports.updateUser = async (req, res) => {
  console.log('req.params.userId:', req.params.userId, 'req.body:', req.body)
    try {
      const user = await User.findById(req.params.userId)

      if (user.emailVerified === true) {
        const updatedUser = await User.findByIdAndUpdate(
          req.params.userId,
          req.body,
          { new: true }
          
      );
      console.log('updated user', updatedUser)
        res.json(updatedUser);
      } else {
        res.status(400).json({ message: "Email not verified" });
      }
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
