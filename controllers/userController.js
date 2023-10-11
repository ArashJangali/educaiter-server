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


  // change Pass


exports.changePass = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ message: "Email not verified" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const changedPass = await User.findByIdAndUpdate(
      req.params.userId,
      { password: hashedPassword },
      { new: true }
    );

    res.json(changedPass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
