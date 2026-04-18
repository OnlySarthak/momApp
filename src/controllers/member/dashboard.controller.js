const teamModel = require("../../models/team.model");
const meetingModel = require("../../models/meeting.model");
const Task = require("../../models/task.model");
const TeamMember = require("../../models/teamMember.model");
const momModel = require("../../models/mom.model");

exports.getDashboardData = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamDetails = await teamModel.findById(teamId);

        const totalTasks = await Task.countDocuments({ responsibleId: req.user._id, teamId });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const todaysMeetingCount = await meetingModel.countDocuments({ 
            teamId, 
            meetingDate: { $gte: today, $lt: tomorrow } 
        });

        const teamMembersList = await TeamMember.find({ teamId }).populate('userId', 'name email');

        const tasks = await Task.find({ responsibleId: req.user._id, teamId }).sort({ createdAt: -1 }).limit(4);

        const recentMOMs = await momModel.find({ teamId }).sort({ createdAt: -1 }).limit(3);

        res.json({
            totalTasks,
            todaysMeetingCount,
            tasks,
            recentMOMs,
            teamMembers: teamMembersList,
            teamDetails
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};

