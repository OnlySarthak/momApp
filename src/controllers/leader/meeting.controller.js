const meeting = require("../../models/meeting.model");
const momModel = require("../../models/mom.model");
const teamMember = require("../../models/teamMember.model");
const Transcript = require("../../models/transcript.model");
const Task = require("../../models/task.model");
const { startMeetingProcessingInBackground } = require("./meetingHelper");
const { timeFrameToDate } = require("../../utils/timeFrameToData");

exports.getMeetingList = async (req, res) => {
    try {
        const teamId = req.user.teamId;

       const filter = req.query.filter || "today";
       const dateRange = timeFrameToDate(filter);

        const meetings = await meeting.find({
            teamId,
            createdAt: dateRange
        });

        const meetingWithMembersNames = await Promise.all(meetings.map(async (m) => {
            const momData = await momModel.findOne({ meetingId: m._id }).select('presentAttendees.name -_id');
            return {
                ...m.toObject(),
                memberNames: momData ? momData.presentAttendees : []
            };
        }));

        res.json(meetingWithMembersNames);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
    }
}

exports.initiateMeeting = async (req, res) => {
    try {
        const { title, project } = req.body;

        const newMeeting = new meeting({
            workspaceId: req.user.workspaceId,
            teamId: req.user.teamId,
            leaderId: req.user.id,
            leaderName: req.user.name,
            title,
            projectName: project || "",
            meetingDate: new Date(),
            processingStage: "initialized"
        });

        const savedMeeting = await newMeeting.save();

        // Start background processing for the meeting
        startMeetingProcessingInBackground(savedMeeting._id, ""); 

        res.status(201).json({ message: "Meeting initiated successfully", meetingId: savedMeeting._id });
    } catch (error) {
        console.error("Error initiating meeting:", error);
        res.status(500).json({ message: "Failed to initiate meeting" });
    }
};

exports.startMeetingProcessing = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { audioUrl } = req.body;

        await startMeetingProcessingInBackground(meetingId, audioUrl);

        res.status(200).json({ message: "Meeting processing started successfully" });
    } catch (error) {
        console.error("Error starting meeting processing:", error);
        res.status(500).json({ message: "Failed to start meeting processing" });
    }
};

exports.deleteMeeting = async (req, res) => {
    try {
        const meetingId = req.params.id;
        await meeting.findByIdAndDelete(meetingId);
        await momModel.findOneAndDelete({ meetingId });
        await Transcript.deleteMany({ meetingId });
        await Task.deleteMany({ meetingId });

        res.status(200).json({ message: "Meeting deleted successfully" });
    } catch (error) {
        console.error("Error deleting meeting:", error);
        res.status(500).json({ message: "Failed to delete meeting" });
    }
};

exports.getMeetingDetails = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const meetingDetails = await meeting.findById(meetingId);
        if (!meetingDetails) {
            return res.status(404).json({ message: "Meeting not found" });
        }
        const momDetails = await momModel.findOne({ meetingId });
        const transcripts = await Transcript.find({ meetingId });

        res.status(200).json({ meetingDetails, momDetails, transcripts });
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ message: "Failed to fetch meeting details" });
    }
};
