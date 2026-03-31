const teamStats = require('../../models/teamStats.model');

exports.getTeamStats = async (req, res) => {
    try {
        const { teamId } = req.params;
        const stats = await teamStats.findOne({ teamId });
        if (!stats) {
            return res.status(404).json({ message: "Team stats not found" });
        }
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching team stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};d