const Team = require("../../models/team.model");
const TeamMember = require("../../models/teamMember.model");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");

//get all members of a workspace
exports.getWorkspaceMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required." });
        }

        const members = await User.find({ workspaceId, isDeleted: { $ne: true } }).select('-passwordHash');

        const memberDetails = await Promise.all(members.map(async (member) => {
            const teamMemberData = await TeamMember.findOne({ userId: member._id });
            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                status: member.status,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }));

        res.status(200).json({ members: memberDetails });
    } catch (error) {
        console.error("Error fetching workspace members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching workspace members." });
    }
};

//need workspaceId from req.user
exports.getDeactivatedMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required." });
        }

        const members = await User.find({ workspaceId, status: false, isDeleted: { $ne: true } }).select('-passwordHash');

        const memberDetails = await Promise.all(members.map(async (member) => {
            const teamMemberData = await TeamMember.findOne({ userId: member._id });
            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                status: member.status,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }));

        res.status(200).json({ members: memberDetails });
    } catch (error) {
        console.error("Error fetching deactivated members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching deactivated members." });
    }
};

//need workspaceId from req.user
exports.getActiveMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required." });
        }

        const members = await User.find({ workspaceId, status: true, isDeleted: { $ne: true } }).select('-passwordHash');

        const memberDetails = await Promise.all(members.map(async (member) => {
            const teamMemberData = await TeamMember.findOne({ userId: member._id });
            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                status: member.status,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }));

        res.status(200).json({ members: memberDetails });
    } catch (error) {
        console.error("Error fetching active members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching active members." });
    }
};

//need workspaceId from req.user
//need role from req.params
exports.getMembersByRole = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const { role } = req.params;
        if (!role || !["admin", "leader", "member"].includes(role)) {
            return res.status(400).json({ message: "Invalid role parameter. Role must be 'admin', 'leader', or 'member'." });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required." });
        }

        const members = await User.find({ workspaceId, systemRole: role, isDeleted: { $ne: true } }).select('-passwordHash');

        const memberDetails = await Promise.all(members.map(async (member) => {
            const teamMemberData = await TeamMember.findOne({ userId: member._id });
            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                status: member.status,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }));

        res.status(200).json({ members: memberDetails });
    }
    catch (error) {
        console.error("Error fetching members by role:", error);
        res.status(500).json({ message: error.message || "Server error while fetching members by role." });
    }
};


//need workspaceId from req.user
//need name, email, systemRole, password from req.body
exports.addUser = async (req, res) => {
    try {
        const workspaceId = req.user?.workspaceId;
        const { name, email, systemRole, password } = req.body;

        if (!name || !email || !systemRole || !password) {
            return res.status(400).json({ message: "Missing required fields: Name, Email, Role, and Password are all required." });
        }

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace assignment failed. Please logout and login again." });
        }

        if (!["admin", "leader", "member"].includes(systemRole)) {
            return res.status(400).json({ message: "Invalid system role provided." });
        }

        // Check if user already exists anywhere in the system
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.workspaceId.toString() === workspaceId.toString()) {
                return res.status(400).json({ message: "A user with this email already exists in your workspace." });
            } else {
                return res.status(400).json({ message: "A user with this email is already registered in another workspace." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            systemRole,
            workspaceId,
            passwordHash: hashedPassword,
            status: false
        });
        await newUser.save();

        res.status(201).json({ message: "User added successfully.", user: { id: newUser._id, name, email, systemRole } });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: error.message || "Server error while adding user." });
    }
};

//Remove a user completely (only if non-admin and deactivated)
exports.removeUser = async (req, res) => {
    try {
        const { id } = req.params;
        const workspaceId = req.user.workspaceId;
        const user = await User.findOne({ _id: id, workspaceId, isDeleted: { $ne: true } });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.systemRole === "admin") return res.status(403).json({ message: "Cannot remove admin" });
        if (user.status !== false) return res.status(400).json({ message: "Can only remove deactivated users" });
        
        // Also soft-delete team mappings
        await TeamMember.updateMany({ userId: id }, { isDeleted: true });
        user.isDeleted = true;
        await user.save();
        res.json({ message: "User removed successfully" });
    } catch (err) {
        console.error("Error removing user:", err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};

exports.renameUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const workspaceId = req.user.workspaceId;
        const user = await User.findOne({ _id: id, workspaceId, isDeleted: { $ne: true } });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.systemRole === "admin") return res.status(403).json({ message: "Cannot modify admin" });
        
        user.name = name;
        await user.save();
        res.json({ message: "User renamed successfully" });
    } catch (err) {
        console.error("Error renaming user:", err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters long" });
        
        const workspaceId = req.user.workspaceId;
        const user = await User.findOne({ _id: id, workspaceId, isDeleted: { $ne: true } });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.systemRole === "admin") return res.status(403).json({ message: "Cannot modify admin" });
        
        user.passwordHash = await bcrypt.hash(password, 10);
        await user.save();
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};
