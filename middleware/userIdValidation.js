const userIdValidation = (req, res, next) => {
    const paramUserId = req.params.userId;
    const authenticatedUserId = req.user._id.toString();

    console.log('paramUserId:',  paramUserId);
    console.log('authenticatedUserId:', authenticatedUserId);
   
    if (paramUserId !== authenticatedUserId) {
        console.log("Mismatch found:");
        console.log("paramUserId: [" + paramUserId + "]");
        console.log("authenticatedUserId: [" + authenticatedUserId + "]");
        return res.status(403).json({ msg: 'Access forbidden' });
    }
    
    next();
};


module.exports = userIdValidation;