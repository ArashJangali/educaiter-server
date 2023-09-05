const userIdValidation = (req, res, next) => {
    const paramUserId = req.params.userId;
    const authenticatedUserId = req.user._id; // the _id from the user document retrieved from the database
    
    if (paramUserId !== authenticatedUserId.toString()) {
        return res.status(403).json({ msg: 'Access forbidden' });
    }
    next();
};


module.exports = userIdValidation;