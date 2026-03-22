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

        const members = await user.find({ workspaceId }).select("name email systemRole");
        res.status(200).json({ members });
    } catch (error) {
        console.error("Error fetching workspace members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching workspace members." });
    }
};

//get all members on bench (free)
exports.getBenchMembersList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const members = await user.find({ workspaceId, systemRole: "bench" }).select("name email systemRole");
        res.status(200).json({ members });
    } catch (error) {
        console.error("Error fetching bench members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching bench members." });
    }
};

//get all team list of a workspace
exports.getTeamsList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const teams = await team.find({ workspaceId });
        res.status(200).json({ teams });
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: error.message || "Server error while fetching teams." });
    }
};

//get all members of a team
exports.getTeamMembersList = async (req, res) => {
    try {
        const { teamId } = req.params;

        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required in params." });
        }

        const teamMembers = await teamMember.find({ teamId }).
            populate("userId", "name email systemRole");

        res.status(200).json({ members: teamMembers.map(member => member.userId) });
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).json({ message: error.message || "Server error while fetching team members." });
    }
};

// Create a new team
exports.createTeam = async (req, res) => {
    try {
        const createdBy = req.user.id; // Assuming user ID is available in cookies
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in cookies
        
        const {
            teamName,
            leaderEmail,
        } = req.body;
        
        //find leader id from email
        const leaderData = await user.findOne({ email: leaderEmail, workspaceId });
        
        //check if leader is exist and on bench in the workspace
        await checkCreateTeamData(leaderData);
        
        console.log("hi")
        //create team 
        const leaderId = leaderData._id;

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
            functionalRole: "leader",
            addedBy: createdBy
        });

        //update user system role to leader
        await user.findOneAndUpdate({ _id: leaderId }, { systemRole: "leader" });


        await newTeamMember.save();

        res.status(201).json(savedTeam);
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// add user in team 
exports.addUserToTeam = async (req, res) => {
    try {
        const { userEmail } = req.body;
        const teamId = req.params.teamId;

        const userData = await user.findOne({ email: userEmail, workspaceId: req.user.workspaceId });
        const userId = userData?._id;
        if (!userId) {
            return res.status(400).json({ message: "User with the provided email does not exist." });
        }


        //check if team and user exist
        await checkAddUserToTeamData(teamId, userId);

        const newTeamMember = new teamMember({
            teamId,
            userId,
            addedBy: req.user.id
        });

        //update user system role to member
        await user.findOneAndUpdate({ _id: userId }, { systemRole: "member" });

        const savedTeamMember = await newTeamMember.save();
        res.status(201).json(savedTeamMember);
    } catch (error) {
        console.error("Error adding user to team:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

//remove user from team
exports.removeUserFromTeam = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const userId = req.params.userId;

        //check if team and user exist
        await checkRemoveUserFromTeamData(teamId, userId);

        await teamMember.deleteOne({ teamId, userId });

        //check if user is removed from team successfully
        const removedTeamMember = await teamMember.findOne({ teamId, userId });
        if (removedTeamMember) {
            throw new Error("Failed to remove user from team");
        }

        res.status(200).json({ message: "User removed from team successfully" });
    } catch (error) {
        console.error("Error removing user from team:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// delete a team
exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        //check if team exist
        await checkDeleteTeamData(teamId, req.user.id);

        //delete all team members first and then delete the team
        await teamMember.deleteMany({ teamId: teamId });
        await team.deleteOne({ _id: teamId });

        //check if team is deleted successfully
        const deletedTeam = await team.findOne({ _id: teamId });
        if (deletedTeam) {
            throw new Error("Failed to delete team");
        }

        res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// change team leader
exports.changeTeamLeader = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const createdBy = req.user.id; // Assuming user ID is available in req.user
        const { newLeaderEmail } = req.body;
        const newLeaderData = await user.findOne({ email: newLeaderEmail, workspaceId: req.user.workspaceId });
        const newLeaderId = newLeaderData?._id;
        if (!newLeaderId) {
            return res.status(400).json({ message: "User with the provided email does not exist." });
        }


        //check if team and new leader exist
        await checkChangeTeamLeaderData(newLeaderId, teamId, createdBy);

        //find old leader id
        const teamData = await team.findById(teamId);
        if (!teamData) {
            return res.status(400).json({ message: "Team with the provided ID does not exist." });
        }
        const oldLeaderId = teamData.leaderId;

        //update team with new leader id
        const updatedTeam = await team.findOneAndUpdate(
            { _id: teamId, createdBy },
            { leaderId: newLeaderId },
            { new: true }
        );

        //update old leader membership
        await teamMember.findOneAndDelete({ teamId, userId: oldLeaderId });
        await user.findOneAndUpdate({ _id: oldLeaderId }, { systemRole: "bench" });

        //update new leader membership
        const newTeamMember = new teamMember({
            teamId,
            userId: newLeaderId,
            functionalRole: "leader",
            addedBy: req.user.id
        });
        await newTeamMember.save();
        await user.findOneAndUpdate({ _id: newLeaderId }, { systemRole: "leader" });


        res.status(200).json(updatedTeam);
    } catch (error) {
        console.error("Error changing team leader:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};


//validation functions 

async function checkCreateTeamData(leaderData) {
    if (!leaderData) {
        throw new Error("Leader data is required");
    }

    if (leaderData.systemRole != "bench") {
        throw new Error("Leader must be on bench");
    }
}

async function checkAddUserToTeamData(teamId, userId) {
    if (!teamId || !userId) {
        throw new Error("Team ID and User ID are required");
    }

    //check if team exist
    const teamData = await team.findOne({ _id: teamId });
    if (!teamData) {
        throw new Error("Invalid team ID");
    }

    //check if user exist and on bench in the workspace
    const userData = await user.findOne({ _id: userId, workspaceId: teamData.workspaceId });
    if (!userData) {
        throw new Error("Invalid user ID or user is not a member of the workspace associated with this team");
    }
    if (userData.systemRole !== "bench") {
        throw new Error("User is not on bench and cannot be added to the team");
    }

    return true;
}

async function checkDeleteTeamData(teamId, createdBy) {
    const teamData = await team.findOne({ _id: teamId, createdBy });
    if (!teamData) {
        throw new Error("Invalid team ID or user is not authorized to delete this team");
    }
}

async function checkChangeTeamLeaderData(newLeaderId, teamId, createdBy) {

    if (!teamId || !newLeaderId) {
        throw new Error("Team ID and New Leader ID are required");
    }

    //check if team exist and is created by the user
    const teamData = await team.findOne({
        _id: teamId,
        createdBy
    });
    if (!teamData) {
        throw new Error("Invalid team ID or user is not authorized to change team leader for this team");
    }

    //check if new leader exist and on bench in the workspace
    const userData = await user.findOne({ _id: newLeaderId, workspaceId: teamData.workspaceId });
    if (!userData) {
        throw new Error("Invalid new leader ID or user is not a member of the workspace associated with this team");
    }
    if (userData.systemRole !== "bench") {
        throw new Error("User is not on bench and cannot be assigned as team leader");
    }

    return true;
}

async function checkRemoveUserFromTeamData(teamId, userId) {

    if (!teamId || !userId) {
        throw new Error("Team ID and User ID are required");
    }

    //check if team exist
    const teamData = await team.findOne({ _id: teamId });
    if (!teamData) {
        throw new Error("Invalid team ID");
    }

    //check if user exist and is a member of the team
    const teamMemberData = await teamMember.findOne({ teamId, userId });
    if (!teamMemberData) {
        throw new Error("User is not a member of the team");
    }

    return true;
}