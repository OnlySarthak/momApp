const express = require('express');
const router = express.Router();

const {
    getSuggestionsForMember,
    createSuggestion
} = require('../../controllers/member/suggestion.controller');

router.get('/suggestions', getSuggestionsForMember);
router.post('/suggestions', createSuggestion);