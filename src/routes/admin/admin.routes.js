const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../../middlewares/auth.middleware");

// Import controllers
const dashboardController = require("../../controllers/admin/dashboard.controller");
const meetingController = require("../../controllers/admin/meeting.controller");
const momController = require("../../controllers/admin/mom.controller");
const taskController = require("../../controllers/admin/task.controller");
const usersController = require("../../controllers/admin/users.controller");
const lookoutController = require("../../controllers/admin/lookout.controller");

// Apply middleware
router.use(auth);
router.use(isAdmin);

// Dashboard
router.get("/dashboard", dashboardController.getDashboardData);

// Meetings
router.get("/meetings", meetingController.getMeetingList);
router.get("/meetings/:id", meetingController.getMeetingDetails);

// MOMs
router.get("/moms", momController.getMomList);
router.get("/moms/:id", momController.getMomDetails);

// Tasks
router.get("/tasks", taskController.getTask);
router.get("/tasks/in-progress", taskController.getInProgressTasks);
router.get("/tasks/completed", taskController.getCompletedTasks);
router.get("/tasks/todo", taskController.getToDoTasks);
router.get("/tasks/team/:teamId", taskController.getTasksByTeam);
router.get("/tasks/member/:memberId", taskController.getTasksByMemberId);

// Users (using correct exports from users.controller.js)
router.get("/users", usersController.getWorkspaceMembersList);
router.get("/users/active", usersController.getActiveMembersList);
router.get("/users/deactivated", usersController.getDeactivatedMembersList);
router.get("/users/role/:role", usersController.getMembersByRole);
router.post("/users", usersController.addUser);
router.delete("/users/:id", usersController.removeUser);
router.put("/users/:id/rename", usersController.renameUser);
router.put("/users/:id/password", usersController.resetPassword);

//lookout routes
router.get("/lookout/teams", lookoutController.lookOutTeams);
router.get("/lookout/team-members", lookoutController.lookOutTeamMembers);
router.get("/lookout/leaders", lookoutController.lookoutLeaders);
router.get("/lookout/members", lookoutController.lookoutMembers);


module.exports = router;