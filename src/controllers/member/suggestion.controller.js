const Suggestion = require("../../models/suggestion.model");
const MOM = require("../../models/mom.model");

//need teamId from req.user
exports.getSuggestionsByMember = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const suggestions = await Suggestion.find({ suggestedBy: userId })
            .populate("momId", "title")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: suggestions });
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//need momId and content from req.body
//need teamId from req.user
exports.createSuggestion = async (req, res) => {
    try {
        const { momId, content } = req.body;
        const userId = req.user.id || req.user._id;

        const momDetails = await MOM.findById(momId);
        if (!momDetails) {
            return res.status(404).json({ success: false, message: "MOM not found" });
        }

        const newSuggestion = new Suggestion({
            momId,
            suggestionText: content,
            suggestedBy: userId,
            status: "pending"
        });

        await newSuggestion.save();

        res.status(201).json({ success: true, message: "Suggestion submitted successfully", data: newSuggestion });
    } catch (error) {
        console.error("Error creating suggestion:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};