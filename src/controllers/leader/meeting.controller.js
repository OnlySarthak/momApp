const meeting = require("../../models/Meeting");
const meetingQueue = require("../queues/meeting.queue");

//create meeting with empty things - before file get uploaded to aws s3
exports.createMeeting = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const leaderId = req.user._id;

        const {
            title,
            teamId,
            meetingDate,
            participants
        } = req.body;

        //validation
        await validateCreateMeetingData(req.body, workspaceId, leaderId);

        //create meeting
        const newMeeting = new meeting({
            title,
            workspaceId,
            teamId,
            leaderId,
            meetingDate,
            participants: participants.map(participantId => ({ id: participantId }))
        });

        await newMeeting.save();

        res.status(201).json({ message: "Meeting created successfully", meetingId: newMeeting._id });

    } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

//start processing meeting after file get uploaded to aws s3
exports.startMeetingProcessing = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { audioFileUrl } = req.body;

        //validate data 
        await validateStartMeetingProcessingData(meetingId, audioFileUrl);

        //update meeting with audio file url and change processing stage to "uploaded"
        const updatedMeeting = await meeting.findByIdAndUpdate(
            meetingId,
            { audioFileUrl, processingStage: "uploaded" },
            { new: true }
        );
        if (!updatedMeeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        //start meeting processing in background
        startMeetingProcessingInBackground(meetingId, audioFileUrl);

        res.status(200).json({
            message: "Meeting processing started successfully",
            meeting: updatedMeeting
        });

    } catch (error) {
        console.error("Error starting meeting processing:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

async function validateCreateMeetingData(data, workspaceId, leaderId) {
    const { title, teamId, meetingDate, participants } = data;

    //title validation
    if (!title || typeof title !== "string") {
        throw new Error("Title is required and must be a string");
    }

    //teamId validation
    if (!teamId || typeof teamId !== "string") {
        throw new Error("Team ID is required and must be a string");
    }

    //meetingDate validation
    if (!meetingDate || isNaN(Date.parse(meetingDate))) {
        throw new Error("Valid meeting date is required");
    }

    //participants validation
    if (!Array.isArray(participants) || participants.some(p => typeof p !== "string")) {
        throw new Error("Participants must be an array of user IDs (strings)");
    }

    //check if participants are memeber of team
    const result = await participants.every(async participantId => {
        const isMember = await checkUserMembership(participantId, teamId, workspaceId);
        if (!isMember) {
            throw new Error(`User with ID ${participantId} is not a member of the team`);
        }
        return true;
    });
    if (!result) {
        throw new Error("One or more participants are not valid team members");
    }
}

async function validateStartMeetingProcessingData(meetingId, audioFileUrl) {
    //meetingId validation
    if (!meetingId || typeof meetingId !== "string") {
        throw new Error("Meeting ID is required and must be a string");
    }

    //audioFileUrl validation
    if (!audioFileUrl || typeof audioFileUrl !== "string") {
        throw new Error("Audio file URL is required and must be a string");
    }
}

