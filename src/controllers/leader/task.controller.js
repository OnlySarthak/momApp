const Task = require("../../models/task.model");
const TeamMember = require("../../models/teamMember.model");
const { populateTaskResponsible, populateMultipleTasksResponsible } = require("../../utils/taskHelper");

//need teamId from req.user
exports.getTasksList = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const memberId = req.query.memberId;

        const filter = { teamId };
        if (memberId) {
            filter.responsibleId = memberId;
        }

        const totalTasks = await Task.countDocuments(filter);
        const completedTasks = await Task.countDocuments({ ...filter, state: "completed" });
        const pendingTasks = await Task.countDocuments({ ...filter, state: "pending" });
        const toDoTasks = await Task.countDocuments({ ...filter, state: "pending" });

        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        const populatedTasks = await populateMultipleTasksResponsible(tasks);

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            toDoTasks,
            tasks: populatedTasks
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
};

//need teamId from req.user
exports.getInProgressTasks = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const inProgressTasks = await Task.find({ teamId, state: "in_progress" }).sort({ createdAt: -1 });
        const populatedTasks = await populateMultipleTasksResponsible(inProgressTasks);

        res.json(populatedTasks);
    } catch (error) {
        console.error("Error fetching in-progress tasks:", error);
        res.status(500).json({ message: "Failed to fetch in-progress tasks" });
    }
}

//need teamId from req.user
exports.getCompletedTasks = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const completedTasks = await Task.find({ teamId, state: "completed" }).sort({ createdAt: -1 });
        const populatedTasks = await populateMultipleTasksResponsible(completedTasks);

        res.json(populatedTasks);
    } catch (error) {
        console.error("Error fetching completed tasks:", error);
        res.status(500).json({ message: "Failed to fetch completed tasks" });
    }
}

//need teamId from req.user
exports.getPendingTasks = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const pendingTasks = await Task.find({ teamId, state: "pending" }).sort({ createdAt: -1 });
        const populatedTasks = await populateMultipleTasksResponsible(pendingTasks);
        res.json(populatedTasks);
    } catch (error) {
        console.error("Error fetching pending tasks:", error);
        res.status(500).json({ message: "Failed to fetch pending tasks" });
    }
}

//need taskTitle and assignedToId from req.body
//need teamId from req.user
exports.assignTask = async (req, res) => {
    try {
        const { taskTitle, assignedToId } = req.body;
        //check if assigned user is in the same team and non leader
        const assignedUser = await TeamMember.findOne({ userId: assignedToId, teamId: req.user.teamId });
        if (!assignedUser) {
            return res.status(404).json({ message: "Assigned user not found in the team" });
        }
        if (assignedUser.functionalRole === "Leader") {
            return res.status(400).json({ message: "Leader cannot be assigned tasks" });
        }


        const assignedTo = await TeamMember.findOne({ userId: assignedToId, teamId: req.user.teamId }).
            populate('userId', 'name email');

        if (!assignedTo) {
            return res.status(404).json({ message: "Assigned user not found in the team" });
        }

        const newTask = new Task({
            title: taskTitle,
            responsibleId: assignedTo.userId._id,
            state: "pending",
            momId: null,
            workspaceId: req.user.workspaceId,
            teamId: req.user.teamId
        });

        await newTask.save();
        const populatedTask = await populateTaskResponsible(newTask);
        res.status(201).json({ message: "Task created successfully", task: populatedTask });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
    }
};


