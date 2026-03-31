const task = require('../../models/Task'); 
const MOM = require('../../models/mom.model');
const suggestion = require('../../models/suggestion.model');

exports.getTodaysMeetings = async (req, res) => {
    try {
        const { id } = req.user ;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const meetings = await MOM.find({ leaderId: id, meetingDate: { $gte: today } }).sort({ meetingDate: 1 });
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching today's meetings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getMeetingDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const meetingDetails = await MOM.findById(id);
        if (!meetingDetails) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        const tasks = await task.find({ meetingId: id });
        const suggestions = await suggestion.find({ meetingId: id });
        const mom = await MOM.findById(id);

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
        const { id } = req.user ;
        const meetings = await MOM.find({ leaderId: id }).sort({ meetingDate: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching all meetings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};




