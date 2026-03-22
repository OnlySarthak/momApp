const user = require("../models/user.model");
const teamMember = require("../models/teamMember.model");
const team = require("../models/team.model");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

exports.auth = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Middleware to check if the user is an admin
exports.isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
        const currentUser = await user.findById(userId);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (currentUser.systemRole !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        next();
    } catch (error) {
        console.error("Error checking admin role:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Middleware to check if the user is a team leader
exports.isTeamLeader = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
        const { teamId} = req.body; // Assuming user ID and team ID are available in req.body

        //check if team exists
        const currentTeam = await team.findById(teamId);
        if (!currentTeam) {
            return res.status(404).json({ message: "Team not found" });
        }

        //check if user is a leader - member of the team
        const currentUser = await teamMember.findOne({ userId, teamId });
        if (!currentUser) {
            return res.status(404).json({ message: "User is not a member of the team" });
        }
        else if (currentUser.functionalRole !== "leader") {
            return res.status(403).json({ message: "Access denied. Team leaders only." });
        }

        next();
    } catch (error) {   
        console.error("Error checking team leader role:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Middleware to check if the user is a team member
exports.isTeamMember = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
        const { teamId } = req.body; // Assuming team ID is available in req.body

        //check if team exists
        const currentTeam = await team.findById(teamId);
        if (!currentTeam) {
            return res.status(404).json({ message: "Team not found" });
        }

        //check if user is a member of the team
        const currentUser = await teamMember.findOne({ userId, teamId });
        if (!currentUser) {
            return res.status(404).json({ message: "User is not a member of the team" });
        }
        next();
    } catch (error) {   
        console.error("Error checking team member role:", error);
        res.status(500).json({ message: "Server error" });
    }
};

