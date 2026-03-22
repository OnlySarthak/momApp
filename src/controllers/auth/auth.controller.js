const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const workspaceModel = require("../../models/workspace.model");

//registrations only for admin users only
exports.registerAdmin = async (req, res) => {
    try {
        //create register admin user for the workspace
        //need worskspace id from cookies
        const { name, email, password } = req.body;
        const systemRole = "admin";

        const workspaceId = req.cookies.workspaceId;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            email,
            passwordHash,
            systemRole,
            name,
            workspaceId
        });

        await newAdmin.save();

        res.cookie("token", newAdmin.generateAuthToken(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // update worspace with the created by field as the admin user id
        const workspace = await workspaceModel.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found." });
        }
        workspace.createdBy = newAdmin._id;
        await workspace.save();

        res.status(201).json({ message: "Admin user registered successfully." ,
            user: {
                email: newAdmin.email,
                systemRole: newAdmin.systemRole,
                name: newAdmin.name
            }
        });
    } catch (error) {
        console.error("Admin registration error:", error);
        res.status(500).json({ message: "Server error during admin registration." });
    }
};

exports.register = async (req, res) => {
    try {
        //need to proviide workspace id in the body of the request
        const { name, email, password, systemRole, workspaceId } = req.body;

        // Validate input
        if (!name || !email || !password || !systemRole || !workspaceId) {
            return res.status(400).json({ message: "Name, email, password, system role, and workspace ID are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use." });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({
            email,
            passwordHash,
            systemRole,
            name,
            workspaceId
        });


        await newUser.save();

        // no need to set cookie here as it is for admin user only 

        res.status(201).json({ message: "User registered successfully." ,
            user: {
                email: newUser.email,
                systemRole: newUser.systemRole,
                name: newUser.name,
                workspaceId: newUser.workspaceId
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
};

//login for all users of the workspace
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }   

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const token = user.generateAuthToken();

        res.cookie("token", token);
        res.status(200).json({
            message: "Login successful.",
            user: {
                name: user.name,
                email: user.email,
                systemRole: user.systemRole,
                workspaceId: user.workspaceId
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful. Please delete the token on the client side." });
}

exports.unregister = async (req, res) => {
    try {
        const { userId } = req.body; ;
        await User.deleteOne({
            _id: userId
        });
        
        res.status(200).json({ message: "User account deleted successfully." });
    } catch (error) {
        console.error("Unregister error:", error);
        res.status(500).json({ message: "Server error during account deletion." });
    }
};

