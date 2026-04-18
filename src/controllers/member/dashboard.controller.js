exports.getDashboardData = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const teamDetails = await teamModel.findById(teamId);

        const totalTasks = await Task.countDocuments({ responsibleId: req.user._id, teamId });
        const todaysMeetingCount = await meetingModel.countDocuments({ teamId, date: { $gte: new Date().setHours(0, 0, 0, 0), $lt: new Date().setHours(23, 59, 59, 999) } } });
        //completed this week and mom you  are will be fake on ui
        const teamMembers = await teamMembers.find({ teamId }).populate('userId', 'name email');

        const tasks = await Task.find({ responsibleId: req.user._id, teamId }).sort({ createdAt: -1 }).limit(4);

        const recentMOMs = await momModel.find({ teamId }).sort({ date: -1 }).limit(3);

        res.json({
            totalTasks,
            todaysMeetingCount,
            tasks,
            recentMOMs,
            teamMembers,
            teamDetails
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};

