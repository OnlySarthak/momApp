const express = require("express");
const router = express.Router();
const { auth, isTeamLeader } = require("../../middlewares/auth.middleware");
const { getTeams, editTeamMemberRole } = require("../../controllers/leader/team.controller");

router.use(auth);
router.use(isTeamLeader);

// Leader Team Management Routes
router.get("/", getTeams); // Get team overview (members + stats)
router.put("/members/:memberId/role", editTeamMemberRole); // Edit functional role of a team member

module.exports = router;