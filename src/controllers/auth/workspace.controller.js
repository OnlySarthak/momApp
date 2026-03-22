const workspaceModel = require("../../models/workspace.model");

//for admin only
exports.createWorkspace = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Workspace name is required." });
        }

        //check if workspace with the same name already exists
        const existingWorkspace = await workspaceModel.findOne({ name });
        if (existingWorkspace) {
            return res.status(400).json({ message: "Workspace with this name already exists." });
        }

        const newWorkspace = new workspaceModel({
            name
        });

        await newWorkspace.save();

        res.cookie("workspaceId", newWorkspace._id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            message: "Workspace created successfully.",
            workspace: newWorkspace
        });
    } catch (error) {
        console.error("Error creating workspace:", error);
        res.status(500).json({ message: error.message || "Server error while creating workspace." });
    }
};

exports.deleteWorkspace = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const workspace = await workspaceModel.findByIdAndDelete(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found." });
        }

        res.status(200).json({ message: "Workspace deleted successfully." });
    } catch (error) {
        console.error("Error deleting workspace:", error);
        res.status(500).json({ message: error.message || "Server error while deleting workspace." });
    }
};

//for all users, need workspace id from cookies
exports.getWorkspaceName = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const workspace = await workspaceModel.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found." });
        }

        res.status(200).json({ name: workspace.name });
    } catch (error) {
        console.error("Error fetching workspace name:", error);
        res.status(500).json({ message: error.message || "Server error while fetching workspace name." });
    }
};



