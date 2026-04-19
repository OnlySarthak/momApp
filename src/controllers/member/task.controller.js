const Task = require("../../models/task.model");
const TeamMember = require("../../models/teamMember.model");

//need teamId and userId from req.user
exports.getTasksList = async (req, res) => {
    try {
        const userId = req.user.id;
        const teamId = req.user.teamId;

        const totalTasks = await Task.countDocuments({ teamId, responsibleId: userId });
        const completedTasks = await Task.countDocuments({ teamId, responsibleId: userId, state: "completed" });
        const pendingTasks = await Task.countDocuments({ teamId, responsibleId: userId, state: "pending" });
        const inProgressTasks = await Task.countDocuments({ teamId, responsibleId: userId, state: "in_progress" });

        const tasks = await Task.find({ teamId, responsibleId: userId }).sort({ createdAt: -1 });

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

//need teamId and userId from req.user
//need status from req.query
exports.getTasksbyFilter = async (req, res) => {
    try {
        const userId = req.user.id;
        const teamId = req.user.teamId;
        const statusFilter = req.query.status;

        if (!["pending", "in_progress", "completed"].includes(statusFilter)) {
            return res.status(400).json({ message: "Invalid status filter" });
        }

        const tasks = await Task.find({ teamId, responsibleId: userId, state: statusFilter }).sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks by filter:", error);
        res.status(500).json({ message: "Failed to fetch tasks by filter" });
    }
}

//need taskTitle and assignedToId from req.body
//need teamId from req.user
exports.assignTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskTitle } = req.body;

        const assignedTo = await TeamMember.findOne({ userId: userId }).
            populate('userId', 'name email');

        if (!assignedTo) {
            return res.status(404).json({ message: "Assigned user not found" });
        }

        const newTask = new Task({
            title: taskTitle,
            resposibleName: assignedTo.userId.name,
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

//need taskId from req.params
//need title from req.body
exports.renameTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const updatedTask = await Task.findByIdAndUpdate(id, { title }, { new: true }).lean();

        if (!updatedTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, data: updatedTask });
    } catch (error) {
        console.error('Error renaming task:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

//need taskId from req.params
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndDelete(id).lean();

        if (!deletedTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, data: deletedTask });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};