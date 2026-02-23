const workspaceModel = require('../../models/workspace.model');

// Create a new workspace
exports.createWorkspace = async (req, res) => {
    try {
        const { name } = req.body;
        const createdBy = req.user._id; // Assuming user ID is available in req.user
        
        // Check if workspace name is provided
        if (!name) {
            return res.status(400).json({ message: "Workspace name is required" });
        }

        //check if workspace with the same name already exists
        const existingWorkspace = await workspaceModel.findOne({
            name,
            createdBy
        });

        if (existingWorkspace) {
            return res.status(400).json({ message: "Workspace with this name already exists" });
        }

        // Create and save the new workspace
        const newWorkspace = new workspaceModel({
            name,
            createdBy,
        });

        const savedWorkspace = await newWorkspace.save();
        res.status(201).json(savedWorkspace);
    }
    catch (error) {
        console.error("Error creating workspace:", error);
        res.status(500).json({ message: "Server error" });
    }
};


