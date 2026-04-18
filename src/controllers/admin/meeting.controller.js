const meeting = require("../../models/meeting.model");
const Mom = require("../../models/mom.model");
const Transcript = require("../../models/transcript.model");
const { timeFrameToDate } = require("../../utils/timeframe.util");

exports.getMeetingList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user
        const timeframe = req.query.timeframe; // Get the timeframe from query parameters

        const dateRange = timeFrameToDate(timeframe);
        const recentMeetings = await meeting.find({ workspaceId, meetingDate: { $gte: dateRange } })
            .sort({ meetingDate: -1 }); // Sort by meeting date in descending order

        const meetingDataWithAttendees = await Promise.all(recentMeetings.map(async (meeting) => {
            const attendees = await Mom.find({ meetingId: meeting._id }).select("presentAttendees.name");
            return {
                ...meeting.toObject(),
                attendees: attendees.flatMap(mom => mom.presentAttendees.map(attendee => attendee.name)) // Extract attendee names
            };
        }));
        
        res.status(200).json({ success: true, data: meetingDataWithAttendees });
    } catch (error) {
        console.error("Error fetching recent meetings:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getMeetingDetails = async (req, res) => {
    try {
        const meetingId = req.params.id; // Get the meeting ID from request parameters
        
        const meetingDetails = await meeting.findById(meetingId);
        if (!meetingDetails) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        const momDetails = await Mom.findOne({ meetingId });
        const transcripts = await Transcript.find({ meetingId });
        
        const combinedData = {
            ...meetingDetails.toObject(),
            mom: momDetails,
            transcripts: transcripts
        };

        res.status(200).json({ success: true, data: combinedData });
    }
    catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
