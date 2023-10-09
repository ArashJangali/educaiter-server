const express = require('express');
const router = express.Router();
const mcqController = require('../controllers/mcqController');

router.post('/add', mcqController.addMCQ);
router.get('/fetch/:selectedAreas/:selectedLevels', mcqController.getMCQ);
router.post('/mcq-answer', mcqController.storeMCQAnswer );


module.exports = router;
