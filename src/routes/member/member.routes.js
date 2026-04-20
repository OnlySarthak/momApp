const express = require("express");
const router = express.Router();
const { auth } = require("../../middlewares/auth.middleware");

// Import controllers
const dashboardController = require("../../controllers/member/dashboard.controller");
const meetingAndMomController = require("../../controllers/member/meetingAndMom.controller");
const momController = require("../../controllers/member/mom.controller");
const taskController = require("../../controllers/member/task.controller");
const { getSuggestionsByMember, createSuggestion } = require("../../controllers/member/suggestion.controller");

// Apply auth middleware to ALL member routes
router.use(auth);

// Dashboard
router.get("/dashboard", dashboardController.getDashboardData);

// Meetings
router.get("/meetings", meetingAndMomController.getMeetingList);
router.get("/meetings/:id", meetingAndMomController.getMeetingDetails);

// MOMs
router.get("/moms", momController.getMOMList);
router.get("/moms/:id", momController.getMomDetails);
router.post("/moms/:id/suggestions", momController.sendSuggestion);

// Tasks — all task operations in one place (avoids duplicate-mount path errors)
router.get("/tasks", taskController.getTasksList);
router.get("/tasks/filter", taskController.getTasksbyFilter);
router.post("/tasks", taskController.assignTask);
router.put("/tasks/rename/:id", taskController.renameTask);
router.delete("/tasks/:id", taskController.deleteTask);

// Suggestions (direct endpoint — separate from MOM suggestions)
router.get("/suggestions", getSuggestionsByMember);
router.post("/suggestions", createSuggestion);

module.exports = router;