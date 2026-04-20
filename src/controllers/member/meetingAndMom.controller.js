const Meeting = require("../../models/meeting.model");
const MOM = require("../../models/mom.model");
const Transcript = require("../../models/transcript.model");
const { timeFrameToDate } = require("../../utils/timeFrameToData");

//need teamId from req.user
//need filter from req.query
exports.getMeetingList = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const filter = req.query.filter || "today";
        const dateRange = timeFrameToDate(filter);

        const meetings = await Meeting.find({
            teamId,
            meetingDate: dateRange
        }).sort({ meetingDate: -1 });

        const meetingWithMembersNames = await Promise.all(meetings.map(async (m) => {
            const momData = await MOM.findOne({ meetingId: m._id }).select('presentAttendees.name -_id');
            return {
                ...m.toObject(),
                memberNames: momData && momData.presentAttendees ? momData.presentAttendees.map(a => a.name) : []
            };
        }));

        res.json(meetingWithMembersNames);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
    }
}

//need meetingId from req.params
exports.getMeetingDetails = async (req, res) => {
    try {
        const meetingId = req.params.id;

        const meetingDetails = await Meeting.findById(meetingId);
        if (!meetingDetails) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }
        const momDetails = await MOM.findOne({ meetingId });
        const transcripts = await Transcript.find({ meetingId });

        res.status(200).json({
            success: true,
            data: {
                ...meetingDetails.toObject(),
                mom: momDetails,
                transcripts: transcripts
            }
        });
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ success: false, message: "Failed to fetch meeting details" });
    }
};