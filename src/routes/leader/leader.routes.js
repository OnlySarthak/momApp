const express = require("express");
const router = express.Router();
const { auth, isTeamLeader } = require("../../middlewares/auth.middleware");
const dashboardController = require("../../controllers/leader/dashboard.controller");

// Apply middleware
router.use(auth);
router.use(isTeamLeader);


// Dashboard
router.get("/dashboard", dashboardController.getDashboardData);

module.exports = router;
