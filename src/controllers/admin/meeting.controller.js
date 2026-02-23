const meeting = require("../../models/meeting.model");
// const teamstats = require("../../models/teamStats.model");

//view all meeting of workspace
exports.getAllMeetings = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user
        const meetings = await meeting.find({ workspaceId }).lean();
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

//view meeting details
exports.getMeetingById = async (req, res) => {
    try {
        const { id } = req.params;
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user

        //will also add team stats in meeting details
        // const teamStatsData = await teamstats.findOne({ meetingId: id });

        const meetingDetails = await meeting.findOne({ _id: id, workspaceId });
        if (!meetingDetails) {
            return res.status(404).json({ message: "Meeting not found" });
        }
        res.status(200).json({ meetingDetails });
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ message: "Server error" });
    }
};

