const mongoose = require('mongoose')

const mcqSchema = new mongoose.Schema({
    area: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    concept: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctOption: {
        type: Number,
        required: true
    },
    explanation: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('MCQ', mcqSchema)