const router = express.Router();

// Import controller functions
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../../controllers/admin/team.controller");

// Routes for team management
router.post("/", createTeam);
router.get("/", getAllTeams);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);

module.exports = router;