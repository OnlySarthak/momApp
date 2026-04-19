const express = require("express");
const router = express.Router();
const { auth, isTeamLeader } = require("../../middlewares/auth.middleware");

// Import verified symbols from src/controllers/leader/task.controller.js
const { 
    getTasksList, 
    getInProgressTasks, 
    getCompletedTasks, 
    getPendingTasks, 
    assignTask 
} = require("../../controllers/leader/task.controller");

// Authorization
router.use(auth);
router.use(isTeamLeader);

// Routes
router.get("/", getTasksList);
router.get("/in-progress", getInProgressTasks);
router.get("/completed", getCompletedTasks);
router.get("/pending", getPendingTasks);
router.post("/", assignTask);

module.exports = router;