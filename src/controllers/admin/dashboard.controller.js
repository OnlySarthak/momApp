const User = require("../../models/user.model");
const Meeting = require("../../models/meeting.model");
const Task = require("../../models/task.model");
const Team = require("../../models/team.model");
const TeamMember = require("../../models/teamMember.model");
const TeamStats = require("../../models/teams.stats.model");

//need workspaceId from req.user
exports.getDashboardData = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const [
            totalUsers,
            totalMeetings,
            totalCompletedTasks,
            totalTeams,
            teamIds
        ] = await Promise.all([
            User.countDocuments({ workspaceId }),
            Meeting.countDocuments({ workspaceId }),
            Task.countDocuments({ workspaceId, state: "completed" }),
            Team.countDocuments({ workspaceId }),
            Team.find({ workspaceId }).distinct("_id")
        ]);

        const teamDirectory = await TeamMember.find({
            teamId: { $in: teamIds }
        })
            .populate("userId", "name email systemRole status")
            .populate("teamId", "teamFunctionalRole teamName")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const stats = await TeamStats.aggregate([
            { $match: { teamId: { $in: teamIds } } },
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: "$totalTasks" },
                    completedTasks: { $sum: "$completedTasks" },
                    inProgressTasks: { $sum: "$inProgressTasks" },
                    pendingTasks: { $sum: "$pendingTasks" }
                }
            }
        ]);

        const {
            totalTasks = 0,
            completedTasks = 0,
            inProgressTasks = 0,
            pendingTasks = 0
        } = stats[0] || {};

        const taskProgress =
            totalTasks > 0
                ? Number(((completedTasks / totalTasks) * 100).toFixed(2))
                : 0;

        res.json({
            cards: {
                totalUsers,
                totalMeetings,
                totalCompletedTasks,
                totalTeams
            },
            teamDirectory,
            systemHealth: {
                totalTasks,
                completedTasks,
                inProgressTasks,
                pendingTasks,
                taskProgress
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Server error" });
    }
};