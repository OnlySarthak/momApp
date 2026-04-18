const team = require("../../models/team.model");
const teamMember = require("../../models/teamMember.model");
const user = require("../../models/user.model");

//get all members of a workspace
exports.getWorkspaceMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await user.find({ workspaceId });
        //get teamMember details and team details for each member 

        const memberDetails = await Promise.all(members.map(async (member) => {
            if (member.status === false) {
                return null; // Skip deactivated members for team details
            }

            const teamMemberData = await teamMember.findOne({ userId: member._id }).populate("teamId", "functionalRole");

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

exports.getDeactivatedMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await user.find({ workspaceId, status: false }).select("name email systemRole");

        res.status(200).json({ members: memberDetails.filter(Boolean) });
    } catch (error) {
        console.error("Error fetching deactivated members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching deactivated members." });
    }
};

exports.getActiveMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await user.find({ workspaceId, status: true }).select("name email systemRole");

        const memberDetails = await Promise.all(members.map(async (member) => {
            
            const teamMemberData = await teamMember.find({ userId: member._id }).populate("teamId", "functionalRole");

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

exports.getMembersByRole = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const { role } = req.params;
        if(!role || !["admin","leader", "member"].includes(role)) {
            return res.status(400).json({ message: "Invalid role parameter. Role must be 'admin', 'member', or 'bench'." });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await user.find({ workspaceId, systemRole: role }).select("name email systemRole");

        const memberDetails = await Promise.all(members.map(async (member) => {
            if (member.status === false) {
                return null; // Skip deactivated members for team details
            }
            const teamMemberData = await teamMember.find({ userId: member._id }).populate("teamId", "functionalRole");
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
        if (!["admin", "leader", "member"].includes(systemRole)) {
            return res.status(400).json({ message: "Invalid system role. Role must be 'admin', 'leader', or 'member'." });
        }

        const existingUser = await user.findOne({ email, workspaceId });
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email already exists in the workspace." });
        }

        const hashedPassword = await user.hashPassword(password);

        const newUser = new user({ name, email, systemRole, workspaceId, passwordHash: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User added successfully.", user: newUser });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: error.message || "Server error while adding user." });
    }
};
