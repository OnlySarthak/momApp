const express = require("express");
const router = express.Router();
const { auth, isTeamLeader } = require("../../middlewares/auth.middleware");

// Import controller functions
const {
  getMeetingList,
  initiateMeeting,
  startMeetingProcessing,
  deleteMeeting,
  getMeetingDetails,
  passWorkspaceIdAndTeamId
} = require("../../controllers/leader/meeting.controller");

// Apply authentication and authorization middleware
router.use(auth);
router.use(isTeamLeader);

// Routes for meetings
router.get("/", getMeetingList);
router.get("/:id", getMeetingDetails);
router.post("/initiate", initiateMeeting);
router.post("/:meetingId/processing", startMeetingProcessing);
router.delete("/:id", deleteMeeting);
router.get("/workspaceId-teamId", passWorkspaceIdAndTeamId);

module.exports = router;
