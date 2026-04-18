const meeting = require("../../models/meeting.model");
const momModel = require("../../models/mom.model");
const teamMember = require("../../models/teamMember.model");
const { startMeetingProcessingInBackground } = require("./meetingHelper");
const { timeFrameToDateRange } = require("../../utils/timeframe.util");

exports.getMeetingList = async (req, res) => {
    try {
        const teamId = req.user.teamId;

       const filter = req.query.filter || "today";
       const dateFilter = getMeetingListHelper(filter);

        const meetings = await meeting.find({
            teamId,
            ...dateFilter
        });

        const meetingWithMembersNames = await Promise.all(meetings.map(async (m) => {
            const memberNames = await momModel.find({ meetingId: m._id }).select('presentAttendees.name -_id');
            return {
                ...m.toObject(),
                memberNames
            };
        }));

        res.json(meetingWithMembersNames);
    } catch (error) {
        console.error("Error fetching today's meetings:", error);
        res.status(500).json({ message: "Failed to fetch today's meetings" });
    }
}