const axios = require('axios');
const User = require("../models/userModel");
const { Assessment } = require('../models/assessmentModel')
require("dotenv").config();
const API_KEY = process.env.API_KEY;
const { check, validationResult } = require('express-validator');


exports.getRecommendation = async (req, res) => {
  try {
    const userId = req.params.userId;

  

    const subject = req.query.subject;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (subject.length > 100) {
      res.status(400).json({ error: 'Subject too long' });
      return;
    }
    if (!subject.match(/^[a-zA-Z0-9 ]+$/)) {
      res.status(400).json({ error: 'Invalid characters in subject' });
      return;
    }


    const incorrectAssessments = await Assessment.find(
      { user: userId, topic: subject, correct: false, timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      "topic level question answer timestamp"
    ).limit(10)

   
    
    let gptMessage =
  "The results for the subject " +
  subject +
  ". Here are the details:\n";
incorrectAssessments.forEach((assessment, index) => {
  gptMessage += `${index + 1}. Level: ${assessment.level}, Question: ${
    assessment.question
  }, Answer: ${assessment.answer}\n`;
});
gptMessage +=
  "What are your recommendations based on these assessments? Ideally, frame your response in this format: 'Considering your recent assessments, I suggest that you prioritize working on ... because ...'";

// Truncate the gptMessage to fit within the token limit
const maxInputTokens = 300; // Set your maximum allowed input tokens
const truncatedMessage = gptMessage.split(' ').slice(0, maxInputTokens).join(' ');
gptMessage = truncatedMessage;

const options = {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
};

const requestBody = {
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: gptMessage }],
  max_tokens: 300,
};
 
    const recommendations = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      requestBody,
      options
    );

    res.status(200).json({
      data: {
        incorrectAssessments: incorrectAssessments,
        recommendations: recommendations.data.choices[0].message.content.trim(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};



exports.getFlashcards = async (req, res) => {
  try {
    const userId = req.params.userId;

  

    const recommendation = req.query.recommendation;

    let flashCardMessage = `Create 5 flashcards based on the recommendation "${recommendation}". Each card should have a question on one side and an answer on the other. Please use the following format for each flashcard:
Flashcard 1:
Question: Your question here
Answer: Your answer here

Flashcard 2:
Question: Your question here
Answer: Your answer here

...and so on for a total of 5 flashcards.`;

// Truncate the flashCardMessage to fit within the token limit
const maxInputTokens = 300; // Set your maximum allowed input tokens
const truncatedMessage = flashCardMessage.split(' ').slice(0, maxInputTokens).join(' ');
flashCardMessage = truncatedMessage;

const options = {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
};

const requestBody = {
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: flashCardMessage }],
  max_tokens: 300,
};

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      requestBody,
      options
    );
    const receivedContent = response.data.choices[0].message.content.trim();

    const flashcardPattern =
      /(?:Flashcard \d+:\nQuestion: )(.*?)(?:\nAnswer: )(.*?)(?:\n\n|$)/g;
    let match;
    const flashcards = [];

    while ((match = flashcardPattern.exec(receivedContent)) !== null) {
      flashcards.push({
        question: match[1].trim(),
        answer: match[2].trim(),
      });
    }

    if (flashcards.length === 0) {
      throw new Error("No flashcards found in the response");
    }



    res.status(200).json({ flashcards });


  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while generating flashcards.",
    });
  }
};