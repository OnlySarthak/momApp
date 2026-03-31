const task = require("../../models/task.model");

exports.getTasksForMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await task.find({ assignedTo: userId, status: { $in: ["pending", "in-proccess"] } })
            .populate("title date time status");
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks for member:", error);
        res.status(500).json({ error: "An error occurred while fetching tasks." });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status } = req.body;

        // status must be inproccess or completed
        if (!["in-proccess", "completed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Status must be 'in-proccess' or 'completed'." });
        }

        const taskToUpdate = await task.findOne({ _id: taskId });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found." });
        }

        taskToUpdate.status = status;
        await taskToUpdate.save();
        
        res.json(taskToUpdate);
    }
    catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "An error occurred while updating task status." });
    }
};