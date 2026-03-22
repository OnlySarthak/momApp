const meeting = require("../../models/Meeting");
const meetingQueue = require("../queues/meeting.queue");

// Create a new meeting when uploaded
exports.createMeeting = async (req, res) => {
    try {
        const { title, description, date, time,audioFileUrl } = req.body;
        const newMeeting = new meeting({
            title,
            description,
            date,
            time,
            audioFileUrl
        });
        const savedMeeting = await newMeeting.save();
        res.status(201).json(savedMeeting);
    } catch (error) {
        res.status(500).json({ message: "Error creating meeting", error });
    }
};


// Get all meetings
exports.getMeetings = async (req, res) => {
    try {
        const meetings = await meeting.find();
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching meetings", error });
    }
};

// Get a meeting by ID  
exports.getMeetingById = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const foundMeeting = await meeting.findById(meetingId);
        if (!foundMeeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }
        res.status(200).json(foundMeeting);
    } catch (error) {
        res.status(500).json({ message: "Error fetching meeting", error });
    }
};

// Update a meeting
exports.updateMeeting = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const { title, description, date, time } = req.body;
        const updatedMeeting = await meeting.findByIdAndUpdate(
            meetingId,
            { title, description, date, time },
            { new: true }
        );
        if (!updatedMeeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }
        res.status(200).json(updatedMeeting);
    } catch (error) {
        res.status(500).json({ message: "Error updating meeting", error });
    }
};

// Delete a meeting
exports.deleteMeeting = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const deletedMeeting = await meeting.findByIdAndDelete(meetingId);
        if (!deletedMeeting) {
            return res.status(404).json({ message: "Meeting not found" });
        } res.status(200).json({ message: "Meeting deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting meeting", error });
    }

};

