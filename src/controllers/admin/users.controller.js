const Team = require("../../models/team.model");
const TeamMember = require("../../models/teamMember.model");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");

//get all members of a workspace
exports.getWorkspaceMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await User.find({ workspaceId }).select('-password');
        //get teamMember details and team details for each member 

        const memberDetails = await Promise.all(members.map(async (member) => {
            if (member.status === false) {
                return null; // Skip deactivated members for team details
            }

            const teamMemberData = await TeamMember.findOne({ userId: member._id }).populate("teamId", "functionalRole");

            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }));

        res.status(200).json({ members: memberDetails.filter(Boolean) });
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

        const members = await User.find({ workspaceId, status: false }).select("name email systemRole").select('-password');

        res.status(200).json({ members });
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
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await User.find({ workspaceId, status: true }).select("name email systemRole").select('-password');

        const memberDetails = await Promise.all(members.map(async (member) => {

            const teamMemberData = await TeamMember.find({ userId: member._id }).populate("teamId", "functionalRole");

            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }));

        res.status(200).json({ members: memberDetails.filter(Boolean) });
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
            return res.status(400).json({ message: "Invalid role parameter. Role must be 'admin', 'member', or 'bench'." });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await User.find({ workspaceId, systemRole: role }).select('-password').select('-password');

        const memberDetails = await Promise.all(members.map(async (member) => {
            if (member.status === false) {
                return null; // Skip deactivated members for team details
            }
            const teamMemberData = await TeamMember.find({ userId: member._id }).populate("teamId", "functionalRole");
            return {
                id: member._id,
                name: member.name,
                email: member.email,
                systemRole: member.systemRole,
                team: teamMemberData ? teamMemberData.functionalRole : null
            };
        }
        ));

        res.status(200).json({ members: memberDetails.filter(Boolean) });
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
        const workspaceId = req.user.workspaceId;
        const { name, email, systemRole, password } = req.body;
        if (!name || !email || !systemRole || !password) {
            return res.status(400).json({ message: "Name, email, system role, and password are required." });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }
        if (!["leader", "member"].includes(systemRole)) {
            return res.status(400).json({ message: "Invalid system role. Role must be 'admin', 'leader', or 'member'." });
        }

        const existingUser = await User.findOne({ email, workspaceId }).select('-password').select('-password');
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email already exists in the workspace." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, systemRole, workspaceId, passwordHash: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User added successfully.", user: newUser });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: error.message || "Server error while adding user." });
    }
};
