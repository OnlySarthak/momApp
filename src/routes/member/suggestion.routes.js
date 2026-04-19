const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth.middleware');

const {
    getSuggestionsByMember,
    createSuggestion
} = require('../../controllers/member/suggestion.controller');

router.use(auth);

router.get('/', getSuggestionsByMember);
router.post('/', createSuggestion);

module.exports = router;