const MOM = require("../../models/mom.model");
const Task = require("../../models/task.model");
const Suggestion = require("../../models/suggestion.model");
const { timeFrameToDate } = require("../../utils/timeFrameToData");
const { populateMomAttendees, populateMultipleMomsAttendees } = require("../../utils/momHelper");
const { populateMultipleTasksResponsible } = require("../../utils/taskHelper");
const { checkNoOfSuggestionsPerMeeting } = require("../../utils/limitChecker");
const LimitExceededError = require("../../utils/LimitExceededError");

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

        const populatedMoms = await populateMultipleMomsAttendees(moms);

        const momsWithAttendees = await Promise.all(populatedMoms.map(async (m) => {
            const totalTasks = await Task.countDocuments({ momId: m._id });
            return {
                ...m,
                totalTasks
            };
        }));

        res.json(momsWithAttendees);
    } catch (error) {
        console.error("Error fetching MOMs:", error);
        res.status(500).json({ message: "Failed to fetch MOMs" });
    }
};

exports.getMomDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const momDetails = await MOM.findById(id)
            .populate('workspaceId', 'name')
            .populate('teamId', 'teamName')
            .populate('meetingId', 'title meetingDate meetingDuration leaderName projectName')
            .lean();

        if (!momDetails) {
            return res.status(404).json({ success: false, message: 'MOM not found' });
        }

        const populatedMomDetails = await populateMomAttendees(momDetails);

        //pending tasks
        const pendingTasks = await Task.find({ momId: id, state: 'pending' }).lean();
        const populatedPendingTasks = await populateMultipleTasksResponsible(pendingTasks);
        //all tasks for export
        const allTasks = await Task.find({ momId: id }).lean();
        const populatedAllTasks = await populateMultipleTasksResponsible(allTasks);
        //suggestions
        const suggestions = await Suggestion.find({ momId: id })
            .populate('suggestedBy', 'name')
            .lean();

        res.status(200).json({ success: true, data: { ...populatedMomDetails, pendingTasks: populatedPendingTasks, allTasks: populatedAllTasks, suggestions } });
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

        // Check suggestion limit for this MOM before creating
        await checkNoOfSuggestionsPerMeeting(id);

        const newSuggestion = new Suggestion({
            momId: id, // Suggestion model uses momId
            suggestionText: content,
            suggestedBy: req.user.id,
            status: 'pending'
        });
        await newSuggestion.save();

        res.status(201).json({ success: true, data: newSuggestion });
    } catch (error) {
        console.error('Error sending suggestion:', error);
        if (error instanceof LimitExceededError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                limitType: error.limitType,
                maxLimit: error.maxLimit,
                currentCount: error.currentCount
            });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};