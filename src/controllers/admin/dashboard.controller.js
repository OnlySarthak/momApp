exports.getDashboardData = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user

        //cards
        const totalUsers = await User.countDocuments({ workspaceId });
        const totalMeetings = await Meeting.countDocuments({ workspaceId });
        const totalCompletedTasks = await Task.countDocuments({ workspaceId, status: "completed" });
        const totalTeams = await Team.countDocuments({ workspaceId });

        //Team directory - minimum any 4 active memebers
        const teamDirectory = await TeamMember.find({ workspaceId })
            .populate("userId", "name email systemRole status")
            .populate("teamId", "teamFunctionalRole teamName")
            .limit(4);

        //system health 
        const TasksOfAllTeams = await Task.countDocuments({ workspaceId });

        const totalTasks = TasksOfAllTeams.map(task => task.totalTasks).reduce((acc, val) => acc + val, 0);
        const completedTasks = TasksOfAllTeams.map(task => task.completedTasks).reduce((acc, val) => acc + val, 0);
        const inProgressTasks = TasksOfAllTeams.map(task => task.inProgressTasks).reduce((acc, val) => acc + val, 0);
        const pendingTasks = TasksOfAllTeams.map(task => task.pendingTasks).reduce((acc, val) => acc + val, 0);
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