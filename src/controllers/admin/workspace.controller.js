exports.register = async (req, res) => {
    try {
        const { name, email, password, workspaceName } = req.body;


        // Check if user already exists
        const existingUser = await
            user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const newUser = new user({
            name,
            email,
            password,
            systemRole: "admin", // Set system role to admin for the first user
        });
        await newUser.save();

        // Create new workspace and associate it with the user
        const newWorkspace = new workspace({
            name: workspaceName,
            adminId: newUser._id,
        });
        await newWorkspace.save();

        // Update user's workspaceId
        newUser.workspaceId = newWorkspace._id;
        await newUser.save();

        //login user
        const token = newUser.generateAuthToken();

        res.cookie("token", token);

        res.status(201).json({ message: "User and workspace created successfully" });
    } catch (error) {
        console.error("Error registering user and creating workspace:", error);
        res.status(500).json({ message: "Server error" });

    }
};

