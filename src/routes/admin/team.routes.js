const express = require("express");
const router = express.Router();
const { isAdmin, auth } = require("../../middlewares/auth.middleware");

// Import verified controller functions from team.controller.js
const {
  getTeamsList,
  addTeam,
  getTeamDetails,
  addTeamMember,
  removeTeamMember,
  replaceTeamLeader,
  deleteTeam
} = require("../../controllers/admin/team.controller");

// Apply authentication and admin authorization
router.use(auth);
router.use(isAdmin);

// Team Management Routes (Admin Only)
router.get("/", getTeamsList);
router.post("/", addTeam);
router.get("/:teamId", getTeamDetails);
router.delete("/:teamId", deleteTeam);
router.post("/:teamId/members", addTeamMember);
router.delete("/:teamId/members/:userId", removeTeamMember);
router.put("/:teamId/leader", replaceTeamLeader);

module.exports = router;