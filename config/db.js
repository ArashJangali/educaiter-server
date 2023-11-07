require('dotenv').config({ path: '/full/path/to/your/.env' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_CONNECTION_URL;

console.log(uri)

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