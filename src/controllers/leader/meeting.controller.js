const meeting = require("../../models/meeting.model");
const teamMember = require("../../models/teamMember.model");
const { startMeetingProcessingInBackground } = require("./meetingHelper");

//create meeting with empty things - before file get uploaded to aws s3
exports.createMeeting = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const leaderId = req.user.id;
        const leaderName = req.user.name;

        const {
            title,
            teamId,
            meetingDate,
        } = req.body;

        const teamMembersData = await teamMember.find({ teamId}).select("userId");
        participants = teamMembersData.map(tm => tm.userId);
        
        //validation
        await validateCreateMeetingData(req.body, workspaceId, leaderId, participants);

        //fetch all teamMembers data for participants

        //create meeting
        const newMeeting = new meeting({
            title,
            workspaceId,
            teamId,
            leaderId,
            leaderName,
            meetingDate,
            participants: participants.map(userId => ({ id: userId }))
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

        // //validate data 
        // await validateStartMeetingProcessingData(meetingId, audioFileUrl);

        // //update meeting with audio file url and change processing stage to "uploaded"
        // const updatedMeeting = await meeting.findByIdAndUpdate(
        //     meetingId,
        //     { audioFileUrl, processingStage: "uploaded" },
        //     { new: true }
        // );
        // if (!updatedMeeting) {
        //     return res.status(404).json({ message: "Meeting not found" });
        // }

        //start meeting processing in background
        await startMeetingProcessingInBackground(meetingId, audioFileUrl).catch(error => {
            console.error("Error in background meeting processing:", error);
        });

        res.status(200).json({
            message: "Meeting processing started successfully",
            // meeting: updatedMeeting
        });

    } catch (error) {
        console.error("Error starting meeting processing:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

exports.getMeetings = async (req, res) => {
    // Implementation for fetching meetings
    try {
        //take userId from req.user and we assume user is leader
        const userId = req.user._id;
        
        const meetings = await meeting.find({ workspaceId });
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//background processing function

async function validateCreateMeetingData(data, workspaceId, leaderId, participants) {
    const { title, teamId, meetingDate } = data;

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

