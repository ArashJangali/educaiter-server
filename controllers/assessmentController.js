const axios = require('axios');
const mongoose = require('mongoose')
const User = require("../models/userModel");
const { Assessment } = require('../models/assessmentModel')
require("dotenv").config();
const API_KEY = process.env.API_KEY;

// Generating answer using GPT

exports.generateQuestion = async (req, res) => {
  const topic = req.params.topic;
  const level = req.params.level;
  const language = req.params.language;
  
  const content = `Given the topic "${topic}" and the programming language "${language}", formulate a question suitable for a "${level}" level learner.`
  const truncatedContent = content.split(' ').slice(0, 100).join(' ');

  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: truncatedContent }],
    max_tokens: 100,
  };
console.log(requestBody)
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
  const language = req.params.language;
  const { userId, question, answer } = req.body;

  const content = `${question}\nAnswer: ${answer}\nIs this answer correct? Please only answer: 'yes' or 'no'.`;
  const truncatedContent = content.split(' ').slice(0, 300).join(' ');

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

    const assessment = new Assessment({ user: userId, question, answer, correct, topic, level, language });
    await assessment.save();
    res.json({ correct });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const aggregateQuizResult = async (userId) => {
  // Convert string userId to ObjectId
  const objectId = new mongoose.Types.ObjectId(userId);

  return await Assessment.aggregate([
    { $match: { user: objectId } },

    // Group by topic, level, and language

    {
      $group: {
        _id: {
          topic: "$topic",
          level: "$level",
          language: "$language",
        },
        totalQuestions: { $sum: 1 },
        correctAnswers: {
          $sum: {
            $cond: [{ $eq: ["$correct", true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        topic: "$_id.topic",
        level: "$_id.level",
        language: "$_id.language",
        totalQuestions: 1,
        correctAnswers: 1,
        percentageCorrect: {
          $round: [
            {
              $multiply: [
                {
                  $divide: ["$correctAnswers", "$totalQuestions"],
                },
                100,
              ],
            },
          ],
        },
      },
    },
  ]).exec();
}


// Barchart

exports.getAssessmentsByUserId = async (req, res) => {
  try {
      const userId = req.params.userId;

      // Fetch aggregated assessments
      const results = await aggregateQuizResult(userId);

      console.log('Aggregation Results:', results);
      res.json(results);
  } catch (error) {
    console.error('Error while aggregating:', error);
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