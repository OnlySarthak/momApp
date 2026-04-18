const momModel = require("../../models/mom.model");

exports.getDashboardData = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamProgress = await TeamStats.findOne({ teamId }).select('teamProductivityScore ');

        //recent Mom
        const recentMOM = await momModel.find({ teamId }).sort({ date: -1 }).limit(2).select('title insights date');

        //recents tasks
        const recentTasks = await Task.find({ teamId }).sort({ createdAt: -1 }).limit(4).select('title assignedTo status');
        
        const teamStats = await TeamStats.findOne({ teamId });

        const teamMembers = await TeamMember.find({ teamId }).populate('userId', 'name');

        const teamMembersTasksDetails = await Promise.all(teamMembers.map(async (member) => {
            const totalTasksAssigned = await Task.countDocuments({ assignedTo: member.userId._id });
            const completedTasks = await Task.countDocuments({ assignedTo: member.userId._id, status: 'completed' });
            return {
                memberName: member.userId.name,
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