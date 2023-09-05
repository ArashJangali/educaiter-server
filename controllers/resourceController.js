const axios = require('axios');
const User = require("../models/userModel");
const { LearningModule } = require("../models/LearningModule")
const { Assessment } = require('../models/assessmentModel')
require("dotenv").config();
const API_KEY = process.env.API_KEY;





const processAssessments = (assessments) => {
    let weakAreas = {}

    const levelWeights = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
    };

    // Give more weight to recent and high-level assessments
    let now = Date.now();
    assessments.forEach(assessment => {
        let weight = 1;
        
        // Weight by recency
        let daysSinceAssessment = (now - new Date(assessment.timestamp)) / (1000 * 60 * 60 * 24);
        weight *= Math.exp(-daysSinceAssessment / 30);  // Half-life of 30 days
        
        // Weight by level
        weight *= levelWeights[assessment.level.toLowerCase()];
        
        // Add to weak areas
        weakAreas[assessment.topic] = (weakAreas[assessment.topic] || 0) + weight * (assessment.correct ? 0 : 1);
    });
  
    // Return the areas with highest weight
    return Object.keys(weakAreas).sort((a, b) => weakAreas[b] - weakAreas[a]);
}

// const generateResources = async (weakAreas, userPreferences) => {
//     let resources = [];

//     for (let weakArea of weakAreas) {
//         // Fetch resources from an external API
//         let response = await axios.get(`https://example.com/api/resources?topic=${weakArea}`);
        
//         // // Filter resources based on user preferences and sort by rating
//         // let topicResources = response.data.filter(resource => userPreferences.resourceTypes.includes(resource.type));
//         // topicResources.sort((a, b) => b.rating - a.rating);
        
//         // resources.push(...topicResources);

//          // Add all resources
//          resources.push(...response.data);
//     }

//     return resources;
// }


// // Generate resources
// exports.getResourcesByUserId = async(req, res) => {
//     try {
//         const userId = req.params.userId;
       
    
//         // Check if the authenticated user is trying to access their own assessments
//         // if (req.user._id.toString() !== userId) {
//         //   return res.status(403).json({ error: 'Forbidden: you are not allowed to access this resource.' });
//         // }

    
//         // Fetch assessments and return them in the response
//         const assessments = await Assessment.find({ user: userId });
//         const user = await User.findById(userId);

//         // Process assessments to identify weak areas
//         let weakAreas = processAssessments(assessments);
        
//         // Generate resources based on weak areas and user preferences
//         let resources = await generateResources(weakAreas, user.learningStyle);

//         res.json(resources);
//       } catch (error) {
//         res.status(500).json({ message: error.message });
//       }
// }


const generateLearningModule = async (topic) => {

  const module = await LearningModule.findOne({ topic: 'Computer Science' });


  return module;
};

// Generate learning modules
const generateLearningModules = async (weakAreas) => {
    let modules = [];

  for (let weakArea of weakAreas) {
    // Generate learning module for weak area
    let moduleContent = await generateLearningModule(weakArea);
    
    modules.push(moduleContent);
  }

  return modules;
}


// Generate learning paths
exports.getLearningPathByUserId = async(req, res) => {
    try {
        const userId = req.params.userId;
       
    
        // Check if the authenticated user is trying to access their own assessments
        // if (req.user._id.toString() !== userId) {
        //   return res.status(403).json({ error: 'Forbidden: you are not allowed to access this resource.' });
        // }

    
        // Fetch assessments and return them in the response
        const assessments = await Assessment.find({ user: userId });

        // Process assessments to identify weak areas
        let weakAreas = processAssessments(assessments);

        
        // Generate learning modules based on weak areas
        let modules = await generateLearningModules(weakAreas);
    console.log('modules', modules)
        res.json(modules);
      
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}












async function createAndSaveModules() {
  const beginnerModule = new LearningModule({
    topic: "Computer Science",
    level: "Beginner",
    outline:
      "Introduction to Python, Variables, Data Types, Control Structures, Functions, Modules",
    goals:
      "Understand the basics of Python programming and be able to write simple Python programs",
    references:
      "Python Crash Course by Eric Matthes, Automate the Boring Stuff with Python by Al Sweigart",
  });

  const intermediateModule = new LearningModule({
    topic: "Computer Science",
    level: "Intermediate",
    outline:
      "Object-Oriented Programming, Exception Handling, File I/O, Standard Libraries, Intermediate Python Projects",
    goals:
      "Understand the principles of object-oriented programming, be able to handle exceptions, work with files, use Python’s standard libraries, and build intermediate-level Python projects",
    references:
      "Effective Python: 90 Specific Ways to Write Better Python by Brett Slatkin, Fluent Python: Clear, Concise, and Effective Programming by Luciano Ramalho",
  });

  const advancedModule = new LearningModule({
    topic: "Computer Science",
    level: "Advanced",
    outline:
      "Design Patterns, Advanced Libraries and Frameworks, Network Programming, Multithreaded Programming, Building and Deploying Full Python Applications",
    goals:
      "Understand common design patterns, use advanced libraries and frameworks, perform network programming, work with multithreaded programs, and build and deploy full-scale Python applications",
    references:
      "Design Patterns: Elements of Reusable Object-Oriented Software by Erich Gamma, Python Cookbook: Recipes for Mastering Python 3 by David Beazley and Brian K. Jones",
  });

  try {
    await beginnerModule.save();
    console.log("Beginner module saved successfully");
  } catch (error) {
    console.error("Failed to save beginner module: ", error);
  }

  try {
    await intermediateModule.save();
    console.log("Intermediate module saved successfully");
  } catch (error) {
    console.error("Failed to save intermediate module: ", error);
  }

  try {
    await advancedModule.save();
    console.log("Advanced module saved successfully");
  } catch (error) {
    console.error("Failed to save advanced module: ", error);
  }
}


createAndSaveModules();
