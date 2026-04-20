const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../../middlewares/auth.middleware");

// Import controllers
const authController = require("../../controllers/auth/auth.controller");
const { register } = require("../../controllers/admin/workspace.controller");
const usersController = require("../../controllers/admin/users.controller");

// Public Routes
router.post("/register", register); // Workspace registration (Admin + Workspace)
router.post("/login", authController.login);

// Protected Routes
router.use(auth);

// Logout
router.get("/logout", authController.logout);

// Admin-only user management (Registration of team members)
router.post("/invite", isAdmin, usersController.addUser);

module.exports = router;