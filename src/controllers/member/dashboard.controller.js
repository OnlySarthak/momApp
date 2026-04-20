const Team = require("../../models/team.model");
const Meeting = require("../../models/meeting.model");
const Task = require("../../models/task.model");
const TeamMember = require("../../models/teamMember.model");
const MOM = require("../../models/mom.model");

//need teamId from req.user
exports.getDashboardData = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const teamDetails = await Team.findById(teamId).populate('leaderId', 'name email');

        const userId = req.user.id;

        const totalTasks = await Task.countDocuments({ responsibleId: userId, teamId });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const todaysMeetingCount = await Meeting.countDocuments({
            teamId,
            meetingDate: { $gte: today, $lt: tomorrow }
        });

        const teamMembersList = await TeamMember.find({ teamId })
            .populate({
                path: 'userId',
                select: 'name email status',
                match: { status: true }
            });

        const activeTeamMembers = teamMembersList.filter(m => m.userId);

        const tasks = await Task.find({ responsibleId: userId, teamId }).sort({ createdAt: -1 }).limit(4);

        const recentMOMs = await MOM.find({ teamId }).sort({ createdAt: -1 }).limit(3);

        res.json({
            totalTasks,
            todaysMeetingCount,
            tasks,
            recentMOMs,
            teamMembers: activeTeamMembers,
            teamDetails
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};
