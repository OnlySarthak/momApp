const express = require("express");
const router = express.Router();

// Import controller functions
const {
  createMeeting,
  startMeetingProcessing
} = require("../../controllers/leader/meeting.controller");

const { auth, isTeamLeader } = require("../../middlewares/auth.middleware");

// Apply authentication middleware to all routes in this router
router.use(auth);
// Apply team leader authorization middleware to all routes in this router
router.use(isTeamLeader);

// Routes for meetings
router.post("/", createMeeting);
router.post("/:id/processing", startMeetingProcessing);


module.exports = router;
