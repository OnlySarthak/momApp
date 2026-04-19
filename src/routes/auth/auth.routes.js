const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../../middlewares/auth.middleware");

// Import controllers
const authController = require("../../controllers/auth/auth.controller");
const workspaceController = require("../../controllers/admin/workspace.controller");
const usersController = require("../../controllers/admin/users.controller");

// Public Routes
router.post("/register", workspaceController.register); // Workspace registration (Admin + Workspace)
router.post("/login", authController.login);

// Protected Routes
router.use(auth);

// Logout
router.get("/logout", authController.logout);

// Admin-only user management (Registration of team members)
router.post("/invite", isAdmin, usersController.addUser);

module.exports = router;// Import controller functions
const {
  register,
  login,
  registerAdmin,
  logout,
  unregister
} = require("../../controllers/auth/auth.controller");

const {
  createWorkspace,
  getWorkspaceName,
  deleteWorkspace
} = require("../../controllers/auth/workspace.controller");

const {
  isAdmin
} = require("../../middlewares/auth.middleware");

const { auth } = require("../../middlewares/auth.middleware");

const router = require("express").Router();

router.post("/workspace",  createWorkspace);
router.post("/login", login);
router.get("/logout", logout);
router.post("/register/admin", registerAdmin);

router.use(auth); // Apply auth middleware to all routes below
// Routes for authentication
router.post("/register", isAdmin,  register);
router.delete("/unregister", isAdmin,  unregister);


router.get("/workspace/name",  getWorkspaceName);
router.delete("/workspace", isAdmin,  deleteWorkspace);

module.exports = router;