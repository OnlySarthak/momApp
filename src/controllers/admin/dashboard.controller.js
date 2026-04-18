const User = require("../../models/user.model");
const Meeting = require("../../models/meeting.model");
const Task = require("../../models/task.model");
const Team = require("../../models/team.model");
const TeamMember = require("../../models/teamMember.model");
const TeamStats = require("../../models/teams.stats.model");

exports.getDashboardData = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user

        //cards
        const totalUsers = await User.countDocuments({ workspaceId });
        const totalMeetings = await Meeting.countDocuments({ workspaceId });
        const totalCompletedTasks = await Task.countDocuments({ workspaceId, state: "completed" });
        const totalTeams = await Team.countDocuments({ workspaceId });

        //Team directory - minimum any 4 active memebers
        const teamDirectory = await TeamMember.find({ workspaceId })
            .populate("userId", "name email systemRole status")
            .populate("teamId", "teamFunctionalRole teamName")
            .limit(4);

        //system health 
        const statsOfAllTeams = await TeamStats.find({ teamId: { $in: await Team.find({ workspaceId }).distinct("_id") } });

        const totalTasks = statsOfAllTeams.reduce((acc, stat) => acc + (stat.totalTasks || 0), 0);
        const completedTasks = statsOfAllTeams.reduce((acc, stat) => acc + (stat.completedTasks || 0), 0);
        const inProgressTasks = statsOfAllTeams.reduce((acc, stat) => acc + (stat.inProgressTasks || 0), 0);
        const pendingTasks = statsOfAllTeams.reduce((acc, stat) => acc + (stat.pendingTasks || 0), 0);
        const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

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