const express = require("express");
const router = express.Router();
const { auth } = require("../../middlewares/auth.middleware");

// Import controllers
const dashboardController = require("../../controllers/member/dashboard.controller");
const meetingAndMomController = require("../../controllers/member/meetingAndMom.controller");
const momController = require("../../controllers/member/mom.controller");
const taskController = require("../../controllers/member/task.controller");

// Apply auth middleware
router.use(auth);

// Dashboard
router.get("/dashboard", dashboardController.getDashboardData);

// Meetings
router.get("/meetings", meetingAndMomController.getMeetingList);

// MOMs
router.get("/moms", momController.getMOMList);
router.get("/moms/:id", momController.getMomDetails);
router.post("/moms/:id/suggestions", momController.sendSuggestion);

// Tasks
router.get("/tasks", taskController.getTasksList);
router.get("/tasks/filter", taskController.getTasksbyFilter);
router.post("/tasks", taskController.assignTask);

module.exports = router;