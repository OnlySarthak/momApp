const MOM = require("../../models/mom.model");
const Task = require("../../models/task.model");
const Suggestion = require("../../models/suggestion.model");
const { timeFrameToDate } = require("../../utils/timeFrameToData");

//need teamId from req.user
//need filter from req.query
exports.getMOMList = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const filter = req.query.filter || "today";
        const dateFilter = timeFrameToDate(filter);

        const moms = await MOM.find({
            teamId,
            createdAt: dateFilter
        }).sort({ createdAt: -1 });

        const momsWithAttendees = await Promise.all(moms.map(async (m) => {
            const totalTasks = await taskModel.countDocuments({ momId: m._id });
            const attendees = await momModel.find({ meetingId: m._id }).select('presentAttendees.name -_id');
            return {
                ...m.toObject(),
                attendees,
                totalTasks
            };
        }));

        res.json(momsWithAttendees);
    } catch (error) {
        console.error("Error fetching MOMs:", error);
        res.status(500).json({ message: "Failed to fetch MOMs" });
    }
};

//need id from req.params(momId)
exports.getMomDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const momDetails = await MOM.findById(id)
            .lean();

        if (!momDetails) {
            return res.status(404).json({ success: false, message: 'MOM not found' });
        }

        //pending tasks
        const pendingTasks = await Task.find({ momId: id, state: 'pending' }).lean();
        //suggestions
        const suggestions = await Suggestion.find({ momId: id }).lean();


        res.status(200).json({ success: true, data: { ...momDetails, pendingTasks, suggestions } });
    } catch (error) {
        console.error('Error fetching MOM details:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

//need id from req.params(momId)
//need content from req.body
exports.sendSuggestion = async (req, res) => {
    try {
        const { id } = req.params; // MOM ID
        const { content } = req.body;

        const momDetails = await MOM.findById(id);
        if (!momDetails) {
            return res.status(404).json({ success: false, message: 'MOM not found' });
        }

        const newSuggestion = new Suggestion({
            meetingId: momDetails.meetingId, // Standardized to meetingId as per schema
            suggestionText: content,
            suggestedBy: req.user.id,
            status: 'pending'
        });
        await newSuggestion.save();

        res.status(201).json({ success: true, data: newSuggestion });
    } catch (error) {
        console.error('Error sending suggestion:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};