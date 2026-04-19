const express = require("express");
const router = express.Router();
const { auth, isTeamLeader } = require("../../middlewares/auth.middleware");
const { getMOMList, getMomDetails, editMOM, approveSuggestion } = require("../../controllers/leader/mom.controller");

router.use(auth);
router.use(isTeamLeader);

router.get("/", getMOMList);
router.get("/:id", getMomDetails);
router.put("/:id", editMOM);
router.put("/suggestion/:id/approve", approveSuggestion);

module.exports = router;