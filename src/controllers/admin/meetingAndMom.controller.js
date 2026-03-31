const Meeting = require('../../models/meeting.model');
const MOM = require('../../models/mom.model');
const task = require('../../models/task.model');

exports.getTodaysMeetings = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const meetings = await Meeting.find({
            workspaceId,
            meetingDate: { $gte: today, $lt: tomorrow }
        }).populate('leaderId', 'name').populate('teamId', 'name');

        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching today's meetings:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

exports.getYesterdaysMeetings = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const meetings = await Meeting.find({
            workspaceId,
            meetingDate: { $gte: yesterday, $lt: today }
        }).populate('leaderId', 'name').populate('teamId', 'name');

        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching yesterday's meetings:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};  

exports.getMeetingDetails = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meetingDetails = await Meeting.findById(meetingId)
            .populate('leaderId', 'name')
            .populate('teamId', 'name')
            .populate('participants.id', 'name');
        if (!meetingDetails) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        const momDetails = await MOM.findOne({ meetingId }).populate('tasks.assignedTo', 'name');
        const tasks = await task.find({ meetingId }).populate('assignedTo', 'name');

        meetingDetails.tasks = tasks;
        MeetingDetails.mom = momDetails;

        res.status(200).json({
            meeting: meetingDetails,
            mom: momDetails,
        });
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};
