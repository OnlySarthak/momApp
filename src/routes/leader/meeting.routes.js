const const express = require("express");
const router = express.Router();

// Import controller functions
const {
  createMeeting,
    getMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting
} = require("../../controllers/leader/meeting.controller");

// Routes for meetings
router.post("/", createMeeting);
router.get("/", getMeetings);
router.get("/:id", getMeetingById);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);
module.exports = router;
