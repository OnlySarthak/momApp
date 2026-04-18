exports.getTeams = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamMembers = await teamMembers.find({ teamId }).populate('userId', 'name email');

        const teamStats = await TeamStats.findOne({ teamId }).select('teamProductivityScore');

        const teamTasks = await Task.find({ teamId }).sort({ createdAt: -1 }).limit(5).select('title status assignedTo');

        res.json({
            teamMembers,
            teamStats,
            teamTasks
        });
    } catch (error) {
        console.error("Error fetching team data:", error);
        res.status(500).json({ message: "Failed to fetch team data" });
    }
};

exports.editTeamMemberRole = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { newRole } = req.body;
        const teamId = req.user.teamId;

        const teamMember = await teamMembers.findOneAndUpdate(
            { _id: memberId, teamId },
            { role: newRole },
            { new: true }
        ).populate('userId', 'name email');
        if (!teamMember) {
            return res.status(404).json({ message: "Team member not found" });
        }
        res.json({ message: "Role updated successfully", teamMember });
    } catch (error) {
        console.error("Error updating team member role:", error);
        res.status(500).json({ message: "Failed to update team member role" });
    }
};