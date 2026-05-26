const meeting = require("../../models/meeting.model");
const Mom = require("../../models/mom.model");
const Transcript = require("../../models/transcript.model");
const User = require("../../models/user.model");
const { timeFrameToDate } = require("../../utils/timeFrameToData");
const { populateMomAttendees } = require("../../utils/momHelper");

//need workspaceId from req.user
exports.getMeetingList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user
        const timeframe = req.query.timeframe; // Get the timeframe from query parameters

        const dateRange = timeFrameToDate(timeframe);
        const recentMeetings = await meeting.find({ workspaceId, meetingDate: dateRange })
            .sort({ meetingDate: -1 }); // Sort by meeting date in descending order

        const meetingDataWithAttendees = await Promise.all(recentMeetings.map(async (meeting) => {
            const momData = await Mom.findOne({ meetingId: meeting._id }).select("presentAttendees");
            let attendeeNames = [];
            if (momData && momData.presentAttendees && momData.presentAttendees.length > 0) {
                const userIds = momData.presentAttendees.map(a => a.userId).filter(Boolean);
                const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
                attendeeNames = users.map(u => u.name);
            }
            return {
                ...meeting.toObject(),
                attendees: attendeeNames
            };
        }));

        res.status(200).json({ success: true, data: meetingDataWithAttendees });
    } catch (error) {
        console.error("Error fetching recent meetings:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

//need workspaceId from req.user
exports.getMeetingDetails = async (req, res) => {
    try {
        const meetingId = req.params.id; // Get the meeting ID from request parameters

        const meetingDetails = await meeting.findById(meetingId);
        if (!meetingDetails) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        const momDetails = await Mom.findOne({ meetingId }).lean();
        const populatedMomDetails = await populateMomAttendees(momDetails);
        const transcripts = await Transcript.find({ meetingId });

        const combinedData = {
            ...meetingDetails.toObject(),
            mom: populatedMomDetails,
            transcripts: transcripts
        };

        res.status(200).json({ success: true, data: combinedData });
    }
    catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
