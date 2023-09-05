require('dotenv').config();
const mongoose = require('mongoose')

const uri = process.env.MONGODB_CONNECTION_URL;

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        })
        console.log('MongoDB connection successful!')
    } catch (error) {
        console.log('Error: ', error.message)
        process.exit(1)
    }
}

module.exports = connectDB