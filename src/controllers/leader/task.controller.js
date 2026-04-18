const { get } = require("mongoose");

exports.getTasksList = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const totalTasks = await Task.countDocuments({ teamId });
        const completedTasks = await Task.countDocuments({ teamId, status: "completed" });
        const pendingTasks = await Task.countDocuments({ teamId, status: "pending" });
        const toDoTasks = await Task.countDocuments({ teamId, status: "pending" });

        const tasks = await Task.find({ teamId }).sort({ createdAt: -1 });

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            toDoTasks,
            tasks
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
};

getInProgressTasks = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const inProgressTasks = await Task.find({ teamId, status: "in-progress" }).sort({ createdAt: -1 });

        res.json(inProgressTasks);
    } catch (error) {
        console.error("Error fetching in-progress tasks:", error);
        res.status(500).json({ message: "Failed to fetch in-progress tasks" });
    }
}

getCompletedTasks = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const completedTasks = await Task.find({ teamId, status: "completed" }).sort({ createdAt: -1 });

        res.json(completedTasks);
    } catch (error) {
        console.error("Error fetching completed tasks:", error);
        res.status(500).json({ message: "Failed to fetch completed tasks" });
    }
}

getPendingTasks = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const pendingTasks = await Task.find({ teamId, status: "pending" }).sort({ createdAt: -1 });
        res.json(pendingTasks);
    } catch (error) {
        console.error("Error fetching pending tasks:", error);
        res.status(500).json({ message: "Failed to fetch pending tasks" });
    }
}

exports.assignTask = async (req, res) => {
    try {
        const { taskTitle, assignedToId} = req.body;
        const assignedTo = await teamMemberModel.findOne({ userId: assignedToId }).
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


