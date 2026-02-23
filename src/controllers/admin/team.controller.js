const team = require("../../models/Team");
const teamMember = require("../../models/teamMember.model");
const workspace = require("../../models/Workspace");

// Create a new team
exports.createTeam = async (req, res) => {
    try {
        const {
            workspaceId,
            teamName,
            leaderId,
            createdBy,
        } = req.body;

        checkCreateTeamData(req.body);

        const newTeam = new team({
            workspaceId,
            teamName,
            leaderId,
            createdBy,
        });

        const savedTeam = await newTeam.save();

        //add team leader as a member of the team
        const newTeamMember = new teamMember({
            teamId: savedTeam._id,
            userId: leaderId,
            functionalRole: "leader"
        });

        await newTeamMember.save();


        res.status(201).json(savedTeam);
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// add user in team 
exports.addUserToTeam = async (req, res) => {
    try {
        const { teamId, userId } = req.body;
        const createdBy = req.user._id; // Assuming user ID is available in req.user

        //check if team and user exist
        checkAddUserToTeamData(req.body, createdBy);

        const newTeamMember = new teamMember({
            teamId,
            userId,
        });

        const savedTeamMember = await newTeamMember.save();
        res.status(201).json(savedTeamMember);
    } catch (error) {
        console.error("Error adding user to team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all teams
exports.getAllTeams = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        //check if workspace id is provided
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required" });
        }

        const teams = await team.find({ workspaceId });
        res.status(200).json(teams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a team by ID
exports.getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        const createdBy = req.user._id; // Assuming user ID is available in req.user

        const teamData = await team.findOne({
            _id: id,
            createdBy
        });
        if (!teamData) {
            return res.status(404).json({ message: "Team not found" });
        }

        //get team members
        const teamMembers = await teamMember.find({ teamId: id }).populate("userId", "name email");

        //combine team data with team members
        const teamDataWithMembers = {
            ...teamData._doc,
            members: teamMembers.map(member => member.userId)
        };

        res.status(200).json(teamDataWithMembers);
    } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// delete a team
exports.deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const createdBy = req.user._id; // Assuming user ID is available in req.user

        //check if team exist
        checkDeleteTeamData(id, createdBy);

        await teamMember.deleteMany({ teamId: id });
        await team.deleteOne({ _id: id });

        res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// change team leader
exports.changeTeamLeader = async (req, res) => {
    try {
        const { teamId, newLeaderId } = req.body;
        const createdBy = req.user._id; // Assuming user ID is available in req.user

        //check if team and new leader exist
        checkChangeTeamLeaderData(req.body, createdBy);

        const updatedTeam = await team.findByIdAndUpdate(
            teamId,
            { leaderId: newLeaderId },
            { new: true }
        );

        res.status(200).json(updatedTeam);
    } catch (error) {
        console.error("Error changing team leader:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Data validation functions
async function checkCreateTeamData(data) {
    const { workspaceId, teamName, leaderId, createdBy } = data;
    //check data validation
    if (!workspaceId || !teamName || !leaderId || !createdBy) {
        throw new Error("Workspace ID, Team Name, Leader ID and Created By are required");
    }

    //check worskpace data
    const workspaceData = await workspace.findById({
        _id: workspaceId,
        createdBy
    });
    if (!workspaceData) {
        throw new Error("Invalid workspace ID or user is not authorized to create team in this workspace");
    }

    //check if team name already exist in the workspace
    const existingTeam = await team.findOne({ workspaceId, teamName });
    if (existingTeam) {
        throw new Error("Team name already exists in this workspace");
    }

    //check if leader is a member of the workspace
    const workspaceMembers = await user.find({ workspaceId });
    if (!workspaceMembers || workspaceMembers.length === 0) {
        throw new Error("No members found in this workspace");
    }

    return true;
}


async function checkAddUserToTeamData(data, createdBy) {
    const { teamId, userId } = data;

    if (!teamId || !userId) {
        throw new Error("Team ID and User ID are required");
    }

    //check if team exist
    const teamData = await team.findById({
        _id: teamId,
        createdBy
    });

    if (!teamData) {
        throw new Error("Invalid team ID or user is not authorized to add members to this team");
    }

    //if user is already a member of the team
    const existingTeamMember = await teamMember.findOne({ teamId, userId });
    if (existingTeamMember) {
        throw new Error("User is already a member of this team");
    }

    //if user is memeber of the workspace
    const workspaceMembers = await user.find({
        _id: userId,
        workspaceId: teamData.workspaceId
    });
    if (!workspaceMembers || workspaceMembers.length === 0) {
        throw new Error("User is not a member of the workspace associated with this team");
    }

    return true;
}

async function checkDeleteTeamData(teamId, createdBy) {
    const teamData = await team.findOne({ _id: teamId, createdBy });
    if (!teamData) {
        throw new Error("Invalid team ID or user is not authorized to delete this team");
    }
}

async function checkChangeTeamLeaderData(data, createdBy) {
    const { teamId, newLeaderId } = data;

    if (!teamId || !newLeaderId) {
        throw new Error("Team ID and New Leader ID are required");
    }

    //check if team exist and is created by the user
    const teamData = await team.findById({
        _id: teamId,
        createdBy
    });
    if (!teamData) {
        throw new Error("Invalid team ID or user is not authorized to change team leader for this team");
    }

    return true;
}