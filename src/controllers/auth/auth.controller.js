const User = require("../../models/user.model");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
    try {
        const { name, email, password, systemRole } = req.body;

        // Validate input
        if (!name || !email || !password || !systemRole) {
            return res.status(400).json({ message: "Name, email, password, and system role are required." });
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
            name
        });


        await newUser.save();
        res.status(201).json({ message: "User registered successfully." ,
            user: {
                id: newUser._id,
                email: newUser.email,
                systemRole: newUser.systemRole,
                name: newUser.name
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
};

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
        const userId = req.user._id; // Assuming user ID is available in req.user
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "User account deleted successfully." });
    } catch (error) {
        console.error("Unregister error:", error);
        res.status(500).json({ message: "Server error during account deletion." });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is available in req.user
        const user = await User.findOne({ _id: userId }, "-passwordHash"); // Exclude passwordHash from the response
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error while fetching user profile." });
    }
};