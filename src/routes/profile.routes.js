const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth.middleware");
const { getProfile, changePassword, updateProfile } = require("../controllers/common/profile");

router.use(auth);

// Common Profile Routes (Accessible by all roles)
router.get("/", getProfile);
router.put("/", updateProfile);
router.post("/change-password", changePassword);

module.exports = router;