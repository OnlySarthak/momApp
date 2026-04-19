const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const workspaceModel = require("../../models/workspace.model");

//need email and password from req.body
//login for all users of the workspace
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

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
        res.status(500).json({ message: error.message || "Server error during login." });
    }
};

exports.logout = (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "Logout successful. Please delete the token on the client side." });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: error.message || "Server error during logout." });
    }
}
