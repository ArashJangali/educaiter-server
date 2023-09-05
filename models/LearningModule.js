const mongoose = require('mongoose');

const LearningModuleSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Design', 'Finance', 'Digital Marketing', 'Law', 'Entrepreneurship', 'Accounting', 'Life Science', 'Physical Science', 'Philosophy', 'Psychology'],
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  },
  outline: {
    type: String,
    required: true,
  },
  goals: {
    type: String,
    required: true,
  },
  references: {
    type: String,
    required: true,
  }
});



module.exports.LearningModule = mongoose.model('LearningModule', LearningModuleSchema);
