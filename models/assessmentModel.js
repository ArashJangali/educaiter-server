const mongoose = require('mongoose')

const assessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    topic: String,
    level: String,
    question: String,
    answer: String,
    correct: Boolean,
    timestamp: { type: Date, default: Date.now }
})

module.exports.Assessment = mongoose.model('Assessment', assessmentSchema)
