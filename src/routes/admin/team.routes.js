const router = require("express").Router();
const { isAdmin } = require("../../middlewares/auth.middleware");

// Import controller functions
const {
  getWorkspaceMembersList,
  getBenchMembersList,
  getTeamsList,
  getTeamMembersList,

  createTeam,
  addUserToTeam,
  changeTeamLeader,
  removeUserFromTeam,
  deleteTeam
} = require("../../controllers/admin/team.controller");

const { auth } = require("../../middlewares/auth.middleware");

router.use(auth); // Apply auth middleware to all routes in this router
router.use(isAdmin); // Apply isAdmin middleware to all routes in this router

// Routes for team management
router.get("/members/workspace", getWorkspaceMembersList);
router.get("/members/bench", getBenchMembersList);
router.get("/teams", getTeamsList);
router.get("/:teamId/members", getTeamMembersList);

router.post("/", createTeam);
router.post("/:teamId/add", addUserToTeam);
router.put("/:teamId/change-leader", changeTeamLeader);
router.delete("/:teamId/:userId", removeUserFromTeam);
router.delete("/:teamId", deleteTeam);

module.exports = router;