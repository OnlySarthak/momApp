const suggestion = require("../../models/suggestion.model");


const getSuggestionsForMember = async (req, res) => {
    try {
        const { userId } = req.user; // Assuming user ID is available in req.user
        const suggestions = await suggestion.find({ suggestedBy: userId }).populate('meetingId', 'title');
        res.json(suggestions);
    } catch (error) {
        console.error("Error fetching suggestions for member:", error);
        res.status(500).json({ error: "An error occurred while fetching suggestions." });
    }
};

const createSuggestion = async (req, res) => {
    try {
        const { userId } = req.user; // Assuming user ID is available in req.user
        const { meetingId, suggestionText } = req.body;
        const newSuggestion = new suggestion({
            suggestedBy: userId,
            meetingId,
            suggestionText
        });
        await newSuggestion.save();
        res.status(201).json(newSuggestion);
    } catch (error) {
        console.error("Error creating suggestion:", error);
        res.status(500).json({ error: "An error occurred while creating the suggestion." });
    }
};