const MCQ = require('../models/MCQ')
const MCQAnswer = require('../models/MCQAnswerModel')


exports.addMCQ = async (req, res) => {
    try {
        const newMCQ = new MCQ(req.body)
        console.log('req', req.body)
        const savedMCQ = await newMCQ.save();
        res.status(201).json(savedMCQ);
    } catch (error) {
        res.status(500).json({ message: 'Error adding MCQ', error });
    }
}

exports.getMCQ = async (req, res) => {

    const areas = req.params.selectedAreas;
    const levels = req.params.selectedLevels;
    const userId = req.query.userId
  

    try {
        const correctAnswers = await MCQAnswer.find({userId, isCorrect: true})
        const correctMcqIds = correctAnswers.map(answer => answer.mcqId);

        const mcqs = await MCQ.find({
            area: { $in: areas },
            level: { $in: levels },
            _id: {$nin: correctMcqIds}
        });

        console.log(mcqs);
        console.log(areas, levels, correctMcqIds);
        if (!mcqs || mcqs.length === 0) {
            return res.status(404).json({ message: 'MCQs not found' });
        }
        res.json(mcqs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching MCQ', error });
    }
}

exports.storeMCQAnswer = async (req, res) => {
    const {userId, mcqId, isCorrect} = req.body
    try {
        await MCQAnswer.create({ userId, mcqId, isCorrect })
        res.status(201).json({ message: 'MCQ answer stored successfully' });
    } catch(error) {
        console.error('Error storing user answer', error);
    }
}