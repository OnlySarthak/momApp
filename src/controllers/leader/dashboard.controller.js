const momModel = require("../../models/mom.model");
const Task = require("../../models/task.model");
const TeamStats = require("../../models/teams.stats.model");
const TeamMember = require("../../models/teamMember.model");

exports.getDashboardData = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamProgress = await TeamStats.findOne({ teamId }).select('TeamProductivityScore');

        //recent Mom
        const recentMOM = await momModel.find({ teamId }).sort({ createdAt: -1 }).limit(2).select('MeetingTitle insights createdAt');

        //recents tasks
        const recentTasks = await Task.find({ teamId }).sort({ createdAt: -1 }).limit(4).select('title responsibleId state');
        
        const teamStats = await TeamStats.findOne({ teamId });

        const teamMembers = await TeamMember.find({ teamId }).populate('userId', 'name');

        const teamMembersTasksDetails = await Promise.all(teamMembers.map(async (member) => {
            const userId = member.userId ? member.userId._id : null;
            const totalTasksAssigned = userId ? await Task.countDocuments({ responsibleId: userId }) : 0;
            const completedTasks = userId ? await Task.countDocuments({ responsibleId: userId, state: 'completed' }) : 0;
            return {
                memberName: member.userId ? member.userId.name : "Unknown",
                totalTasksAssigned,
                completedTasks
            };
        }));

        res.json({
            teamProgress,
            recentMOM,
            recentTasks,
            teamMembersTasksDetails,
            teamStats
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};