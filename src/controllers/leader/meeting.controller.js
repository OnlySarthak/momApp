const meeting = require("../../models/Meeting");
const meetingQueue = require("../queues/meeting.queue");

//create meeting with empty things - before file get uploaded to aws s3
exports.createMeeting = async (req, res) => {
    try {
        const {
            title,
        }