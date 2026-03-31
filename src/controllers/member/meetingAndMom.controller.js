const meeting = require('../../models/meeting.model');
const MOM = require('../../models/mom.model');
const suggestion = require('../../models/suggestion.model');

exports.getTodaysMeetings = async (req, res) => {
    try {
        const { userId } = req.user;
        const teamMemberData = await teamMember.findOne({ userId }).select('teamId');
        if (!teamMemberData) {
            return res.status(404).json({ message: "Team member data not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const meetings = await meeting.find({
            teamId: teamMemberData.teamId,
            meetingDate: { $gte: today, $lt: tomorrow }
        }).populate('leaderId', 'name').populate('teamId', 'name');
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching today's meetings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getYesterdaysMeetings = async (req, res) => {
    try {
        const { userId } = req.user;
        const teamMemberData = await teamMember.findOne({ userId }).select('teamId');
        if (!teamMemberData) {
            return res.status(404).json({ message: "Team member data not found" });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const meetings = await meeting.find({
            teamId: teamMemberData.teamId,
            meetingDate: { $gte: yesterday, $lt: today }
        }).populate('leaderId', 'name').populate('teamId', 'name');
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching yesterday's meetings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getMeetingDetails = async (req, res) => {
    try {
        const { id } = req.params;  
        const meetingDetails = await meeting.findById(id).populate('leaderId', 'name').populate('teamId', 'name').populate('participants.id', 'name');
        if (!meetingDetails) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        const tasks = await task.find({ meetingId: id }).populate('assignedTo', 'name');
        const suggestions = await suggestion.find({ meetingId: id }).populate('suggestedBy', 'name');
        const mom = await MOM.findOne({ meetingId: id }).populate('createdBy', 'name');

        if(!mom){
            return res.status(404).json({ message: "MOM not found" });
        }

        meetingDetails.tasks = tasks;
        meetingDetails.suggestions = suggestions;
        meetingDetails.mom = mom;

        res.status(200).json(meetingDetails);
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getAllMeetings = async (req, res) => {
    try {
        const id = req.user.id;
        const teamId = await teamMember.findOne({ userId: id }).select('teamId');
        const meetings = await meeting.find({ teamId: teamId.teamId }).populate('leaderId', 'name').populate('teamId', 'name');
        
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching all meetings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};