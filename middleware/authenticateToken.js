const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

async function authenticateToken(req, res, next) {
 
    const token = req.cookies.token;
   

    if (token == null) {
        console.log('Token is null');
        return res.status(401).json({ error: 'Token is null' });
    }

    try {
        const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
       
        const user = await User.findById(decodedPayload._id);
        console.log('User: ', user);

        if (!user) {
            console.log('User not found');
            return res.status(403).json({ error: 'User not found' });
        }

        req.user = user.toObject();
        delete req.user.password;  
        next();
    } catch (err) {
        console.log("Error in token verification: ", err.message);
        return res.status(403).json({ error: err.message });
    }
}


module.exports = authenticateToken;
