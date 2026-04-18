exports.getTasksList = async (req, res) => {
    try {
        const userId = req.user._id;
        const teamId = req.user.teamId;

        const totalTasks = await Task.countDocuments({ teamId, assignedTo: userId });
        const completedTasks = await Task.countDocuments({ teamId, assignedTo: userId, status: "completed" });
        const pendingTasks = await Task.countDocuments({ teamId, assignedTo: userId, status: "pending" });
        const inProgressTasks = await Task.countDocuments({ teamId, assignedTo: userId, status: "in-progress" });

        const tasks = await Task.find({ teamId, assignedTo: userId }).sort({ createdAt: -1 });

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            tasks
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
};

getTasksbyFilter = async (req, res) => {
    try {
        const userId = req.user._id;
        const teamId = req.user.teamId;
        const statusFilter = req.query.status;

        if (!["pending", "in-progress", "completed"].includes(statusFilter)) {
            return res.status(400).json({ message: "Invalid status filter" });
        }

        const tasks = await Task.find({ teamId, assignedTo: userId, status: statusFilter }).sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks by filter:", error);
        res.status(500).json({ message: "Failed to fetch tasks by filter" });
    }
}

exports.assignTask = async (req, res) => {
    try {
        const { name, userId, } = req.user;
        const { taskTitle} = req.body;
        const assignedTo = await teamMemberModel.findOne({ userId: userId }).
            populate('userId', 'name email');

        if (!assignedTo) {
            return res.status(404).json({ message: "Assigned user not found" });
        }

        const newTask = new Task({
            title: taskTitle,
            responsibleName: assignedTo.userId.name,
            responsibleFunctionalRole: assignedTo.functionalRole,
            responsibleId: assignedTo.userId._id,
            state: "pending",
            momId: null,
            workspaceId: req.user.workspaceId,
            teamId: req.user.teamId
        });

        await newTask.save();
        res.status(201).json({ message: "Task created successfully", task: newTask });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
    }
};