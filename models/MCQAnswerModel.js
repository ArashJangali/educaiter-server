const mongoose = require('mongoose')

const MCQAnswerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mcqId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MCQ',
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
      },
    timestamp: {
        type: Date,
        default: Date.now
      }
})

const MCQAnswer = mongoose.model('MCQAnswer', MCQAnswerSchema)

module.exports = MCQAnswer;