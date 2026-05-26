const TeamMember = require("../../models/teamMember.model");
const TeamStats = require("../../models/teams.stats.model");
const Task = require("../../models/task.model");

//need teamId from req.user
exports.getTeams = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamMembers = await TeamMember.find({ teamId, isDeleted: { $ne: true } })
            .populate({
                path: 'userId',
                select: 'name email status',
                match: { status: true, isDeleted: { $ne: true } }
            });

        const activeTeamMembers = teamMembers.filter(m => m.userId).map(m => ({
            userId: m.userId._id,
            memberName: m.userId.name,
            memberEmail: m.userId.email,
            functionalRole: m.functionalRole || "Member",
            isLeader: m.userId._id.toString() === req.user.id.toString(),
            id: m._id
        }));

        const teamStats = await TeamStats.findOne({ teamId });
        const teamTasks = await Task.find({ teamId }).sort({ createdAt: -1 }).limit(5).select('title state responsibleId');

        res.json({
            teamMembers: activeTeamMembers,
            teamStats,
            teamTasks
        });


    } catch (error) {
        console.error("Error fetching team data:", error);
        res.status(500).json({ message: "Failed to fetch team data" });
    }
};

//need memberId from req.params
//need newRole from req.body
//need teamId from req.user
exports.editTeamMemberRole = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { newRole } = req.body;
        const teamId = req.user.teamId;

        const teamMemberResult = await TeamMember.findOneAndUpdate(
            { userId: memberId, teamId, isDeleted: { $ne: true } },
            { functionalRole: newRole },
            { new: true }
        ).populate('userId', 'name email');

        if (!teamMemberResult) {
            return res.status(404).json({ message: "Team member not found" });
        }
        res.json({ message: "Role updated successfully", teamMember: teamMemberResult });
    } catch (error) {
        console.error("Error updating team member role:", error);
        res.status(500).json({ message: "Failed to update team member role" });
    }
};