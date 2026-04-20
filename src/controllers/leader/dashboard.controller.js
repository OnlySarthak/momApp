const MOM = require("../../models/mom.model");
const Task = require("../../models/task.model");
const TeamStats = require("../../models/teams.stats.model");
const TeamMember = require("../../models/teamMember.model");
const Team = require("../../models/team.model");


//need teamId from req.user
exports.getDashboardData = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamInfo = await Team.findOne({ _id: teamId });

        const teamProgress = await TeamStats.findOne({ teamId }).select('TeamProductivityScore');

        //recent Mom
        const recentMOM = await MOM.find({ teamId }).sort({ createdAt: -1 }).limit(2).select('MeetingTitle insights createdAt');

        //recents tasks
        const recentTasks = await Task.find({ teamId }).sort({ createdAt: -1 }).limit(4).select('title responsibleId state');

        const teamStats = await TeamStats.findOne({ teamId });

        const teamMembers = await TeamMember.find({ teamId })
            .populate({
                path: 'userId',
                select: 'name status',
                match: { status: true } // Only include active users
            });

        // Filter out members where userId is null (because of the match filter)
        const activeTeamMembers = teamMembers.filter(m => m.userId);

        const teamMembersTasksDetails = await Promise.all(activeTeamMembers.map(async (member) => {
            const userId = member.userId._id;
            const totalTasksAssigned = userId ? await Task.countDocuments({ responsibleId: userId }) : 0;
            const completedTasks = userId ? await Task.countDocuments({ responsibleId: userId, state: 'completed' }) : 0;
            return {
                userId,
                memberName: member.userId ? member.userId.name : "Unknown",
                functionalRole: member.functionalRole || "Member",
                isLeader: userId.toString() === req.user.id.toString(),
                totalTasksAssigned,
                completedTasks
            };
        }));


        res.json({
            teamProgress,
            recentMOM,
            recentTasks,
            teamMembersTasksDetails,
            teamStats,
            teamInfo
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};