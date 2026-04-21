const workspace = require("../../models/workspace.model");
const user = require("../../models/user.model");
const bcrypt = require("bcrypt");

//need name, email, password, workspaceName from req.body
exports.register = async (req, res) => {
    try {
        const { name, email, password, workspaceName } = req.body;

        if (!name || !email || !password || !workspaceName) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 1. Create new workspace first
        const newWorkspace = new workspace({
            name: workspaceName,
        });
        await newWorkspace.save();

        // 2. Create new user and associate it with the workspace
        const newUser = new user({
            name,
            email,
            passwordHash,
            systemRole: "admin", // Set system role to admin for the first user
            status: true, // Activate the initial admin
            workspaceId: newWorkspace._id,
        });

        await newUser.save();

        // 3. Update workspace's createdBy field
        newWorkspace.createdBy = newUser._id;
        await newWorkspace.save();

        // login user
        const token = newUser.generateAuthToken();

        res.cookie("token", token, { maxAge: 30 * 24 * 60 * 60 * 1000 });

        res.status(201).json({ 
            message: "User and workspace created successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                workspaceId: newUser.workspaceId
            }
        });
    } catch (error) {
        console.error("Error registering user and creating workspace:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};


