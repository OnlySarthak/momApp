const 
const router = express.Router();

// Import controller functions
const {
  registerUser,
  loginUser,
  logoutUser,
  unregisterUser,
  getUserProfile,
} = require("../../controllers/auth/auth.controller");

// Routes for authentication
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.delete("/unregister", unregisterUser);
router.get("/profile", getUserProfile);
module.exports = router;