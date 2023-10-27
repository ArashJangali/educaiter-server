const express = require("express");
const router = express.Router();
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone')
require("dotenv").config();
const { Conversation } = require("../models/messageModel");
const { analyzeImage } = require('../controllers/imageAnalysis')
const API_KEY = process.env.API_KEY;
const uuid = require('uuid');
const axios = require('axios');
const { check, validationResult } = require('express-validator');
const userIdValidation = require('../middleware/userIdValidation')
const { checkSubscriptionExists, usageLimit, usageLimitImageAnalysis } = require('../middleware/checkSubscription')



const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }

    cb('Error: File upload only supports the following filetypes - ' + filetypes);
}
})



// Chat endpoint
router.post("/completions", [ usageLimit, check('userId').notEmpty().isMongoId(),
check('message').trim().escape(),
check('role').trim().escape(),
check('hasIntroduced').isBoolean(),], async (req, res) => {


  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.body.userId;

  const bodyUserId = req.body.userId;
    const authenticatedUserId = req.user._id; // the _id from the user document retrieved from the database
    
    if (bodyUserId !== authenticatedUserId.toString()) {
        return res.status(403).json({ msg: 'Access forbidden' });
    }

  const userContent = req.body.message;
  const convoId = req.body.convoId
  const role = req.body.role
  const hasIntroduced = req.body.hasIntroduced
  console.log("Role received: ", role);


  const introduction = hasIntroduced
  ? `Act as a ${role}`
  : `Act as a ${role} and help the user in the chat. Introduce yourself. No need to provide name. Keep it short. End with asking what you can help the user with.`
  const gptMessage = `${introduction} User message: ${userContent}`
console.log(gptMessage)
  
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: gptMessage }],
      max_tokens: 100,
    }),
  }


  try {
    const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        options);
    const data = await response.json();
  


      let conversation = await Conversation.findOne({ user: userId, conversationId: convoId })
      let actualConvoId = convoId;
      if (!conversation){
         actualConvoId = uuid.v4()
        conversation = new Conversation({ user: userId, conversationId: actualConvoId  });
      }

      conversation.convo.push({ content: userContent, role: 'user' })
      conversation.convo.push({ content: data.choices[0].message.content, role: 'ai' })
      await conversation.save()
      
      res.send({data, convoId: actualConvoId});
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});




// Image analysis
router.post('/analyze-image', checkSubscriptionExists, usageLimitImageAnalysis, upload.single('image'), async (req, res) => {

  const imageBuffer = req.file.buffer;
  const mimeType = req.file.mimetype;
 
  try {
    const analysisResult = await analyzeImage(imageBuffer, mimeType);
    console.log('analysisresult:', analysisResult)
    res.send(analysisResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.sendStatus(500);
}
})


// fetch chat history
router.get('/chat-history/:userId', [
  checkSubscriptionExists,
  usageLimit,
], async (req, res) => {

 
 


  const userId = req.params.userId


  const paramUserId = req.params.userId;
    const authenticatedUserId = req.user._id; // the _id from the user document retrieved from the database
    
    if (paramUserId !== authenticatedUserId.toString()) {
        return res.status(403).json({ msg: 'Access forbidden' });
    }


  const searchTerm = req.query.sidebarSearch
  const arrayOfMessages = []

  try {
 
    const chatHistory = await Conversation.find({ 
      user: userId,
      'convo.content': { $regex: searchTerm, $options: 'i' }
    })
    chatHistory.map((object) => {
      const convo = object.convo
      const messages = convo.map(message => {
        const singleMessages = message.content
        arrayOfMessages.push(singleMessages)
      })
    })


    const gptMessage = `Based on the following conversation between me and you: ${arrayOfMessages}, please provide:
Title: Generate a concise and informative title that encapsulates the main theme of the conversation.
Topics We Discussed: Identify the main areas of knowledge or subjects that we explored.
Your Interests: Note the areas that you seemed particularly engaged or interested in.
Strengths: Highlight where you seemed confident or excelled.
Areas for Improvement: Identify areas where you might need more support or exploration.
Your Engagement Level: Assess how engaged you were in the conversation and the learning process. type: it should be a string format. NOT bulletpoint format.`;



const options = {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
}

const requestBody = {
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: gptMessage }],
  max_tokens: 250,
}

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      requestBody,
      options
    );

    const receivedContent = response.data.choices[0].message.content.trim();

    const pattern = /(?:Title: )([\s\S]*?)(?:\nTopics We Discussed: )([\s\S]*?)(?:\nYour Interests: )([\s\S]*?)(?:\nStrengths: )([\s\S]*?)(?:\nAreas for Improvement: )([\s\S]*?)(?:\nYour Engagement Level: )([\s\S]*?)(?:\n|$)/;

    const match = pattern.exec(receivedContent);
  
    if (match) {
      const summaryOfConvos = {
        title: match[1].trim(),
        topics: match[2].trim(),
        interests: match[3].trim(),
        strengths: match[4].trim(),
        improvementAreas: match[5].trim(),
        engagementLevel: match[6].trim(),
      };
      console.log(summaryOfConvos)
      res.status(200).json({ 
        history: chatHistory,
        summaryOfConvos: summaryOfConvos,
        receivedContent: receivedContent
      })
    } else if(!match){
      res.status(200).json({ 
        receivedContent: receivedContent
      })
    } else {
      // Handle the error when the pattern doesn't match
      res.status(500).json({ error: 'An error occurred while parsing the conversation summary' });
    } 
    

  } catch(error) {
    console.log(error)
    res.status(500).json({ error: 'An error occurred while fetching chat history' });
  }
})




const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API,
  environment: 'gcp-starter'
})

const index = pinecone.Index('educaiter')







module.exports = router;


