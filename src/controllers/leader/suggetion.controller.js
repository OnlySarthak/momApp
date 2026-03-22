const suggestionModel = require("../../models/suggestion.model");

//view all suggestions for a meeting
exports.viewSuggestions = async (req, res) => {
    try {
        const {
            meetingId
        } = req.params;
        const suggestions = await suggestionModel.find({
            meetingId: meetingId
        });
        res.status(200).json(suggestions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching suggestions", error });
    }
};

//update a suggestion by acception or rejection
exports.updateSuggestion = async (req, res) => {
    try {
        const {
            suggestionId,
                action
        } = req.params;

        //verify data
        verifyUpdateSuggestionData(suggestionId, action);

        const updatedSuggestion = await suggestionModel.findByIdAndUpdate(
            suggestionId, {
                status: action === "accept" ? "accepted" : "rejected"         }, 
            { new: true }
        );

        if (!updatedSuggestion) {
            return res.status(404).json({ message: "Suggestion not found" });
        }

        res.status(200).json(updatedSuggestion);

    } catch (error) {
        console.error("Error updating suggestion:", error);
        res.status(500).json({ message: "Error updating suggestion", error: error.message });
    }
}

verifyUpdateSuggestionData = (suggestionId, action) => {
    if (!suggestionId || !action) {
        throw new Error("Missing required fields: suggestionId and action");
    }

    const validActions = ["accept", "reject"];
    if (!validActions.includes(action)) {
        throw new Error(`Invalid action. Must be one of: ${validActions.join(", ")}`);
    }

    return true;
}