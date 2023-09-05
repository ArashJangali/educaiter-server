const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

async function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (token == null) return res.sendStatus(401);

    try {
        const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
        // Fetch the user data from the database using the _id from the JWT payload
        const user = await User.findById(decodedPayload._id);

        if (!user) return res.sendStatus(403);

        req.user = user.toObject();  // Convert the user document to a plain javascript object
        delete req.user.password;  
        next();
    } catch (err) {
        return res.sendStatus(403);
    }
}

module.exports = authenticateToken;
