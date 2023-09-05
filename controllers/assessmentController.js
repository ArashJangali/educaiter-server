const axios = require('axios');
const User = require("../models/userModel");
const { Assessment } = require('../models/assessmentModel')
require("dotenv").config();
const API_KEY = process.env.API_KEY;

// Generating answer using GPT

exports.generateQuestion = async (req, res) => {
  const topic = req.params.topic;
  const level = req.params.level;
  
  const content = `Act as a ${topic} teacher. Create a ${level} level question about ${topic}. Please present just the question. Not any other words.`;
  const truncatedContent = content.split(' ').slice(0, 100).join(' ');

  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: truncatedContent }],
    max_tokens: 100,
  };

  const options = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const question = await axios.post("https://api.openai.com/v1/chat/completions", requestBody, options);
    res.json({ question: question.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error generating question:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// evaluate answer using GPT

exports.evaluateAnswer = async (req, res) => {
  const topic = req.params.topic;
  const level = req.params.level;
  const { userId, question, answer } = req.body;

  const content = `${question}\nAnswer: ${answer}\nIs this answer correct? Please only answer: 'yes' or 'no'.`;
  const truncatedContent = content.split(' ').slice(0, 100).join(' ');

  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: truncatedContent }],
    max_tokens: 100,
  };

  const options = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const result = await axios.post("https://api.openai.com/v1/chat/completions", requestBody, options);

    const correct = result.data.choices[0].message.content.trim().toLowerCase() === 'yes.';

    const assessment = new Assessment({ user: userId, question, answer, correct, topic, level });
    await assessment.save();
    res.json({ correct });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Get all user assessments

exports.getAssessmentsByUserId = async(req, res) => {
    try {
        const userId = req.params.userId;
       
   
    
        // Fetch assessments and return them in the response
        const assessments = await Assessment.find({ user: userId })
        res.json(assessments);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

exports.lineChart = async (req, res) => {
  try {
    const userId = req.params.userId;


    // Fetch assessments and return them in the response
    const assessments = await Assessment.find({ user: userId })



    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}