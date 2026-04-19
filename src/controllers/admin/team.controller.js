const Team = require("../../models/team.model");
const TeamMember = require("../../models/teamMember.model");
const TeamStats = require("../../models/teams.stats.model");
const User = require("../../models/user.model");
const Task = require("../../models/task.model");
const Meeting = require("../../models/meeting.model");

//need workspaceId from req.user
exports.getTeamsList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required." });
        }

        const teams = await Team.find({ workspaceId });
        const teamDetails = await Promise.all(teams.map(async (team) => {
            const memberData = await TeamMember.find({ teamId: team._id }).populate("userId", "name");
            const teamTaskData = await TeamStats.findOne({ teamId: team._id }).select("TeamProductivityScore completedTasks");

            return {
                id: team._id,
                teamName: team.teamName,
                leaderId: team.leaderId,
                createdBy: team.createdBy,
                TeamProductivityScore: teamTaskData ? teamTaskData.TeamProductivityScore : 0,
                totalTasksCompleted: teamTaskData ? teamTaskData.completedTasks : 0,
                members: memberData.map(member => member.userId ? member.userId.name : "Unknown")
            };
        }));

        res.status(200).json({ teams: teamDetails });
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: error.message || "Server error while fetching teams." });
    }
};

//need workspaceId and id from req.user
//need teamName, leaderId, project, teamDescription, teamFunctionalRole from req.body
exports.addTeam = async (req, res) => {
    try {
        const { teamName, leaderId, project, teamDescription, teamFunctionalRole } = req.body;
        const createdBy = req.user.id;
        const workspaceId = req.user.workspaceId;

        if (!teamName || !leaderId) {
            return res.status(400).json({ message: "Team name and leader ID are required." });
        }

        const newTeam = new Team({
            workspaceId,
            teamName,
            leaderId,
            project,
            teamDescription,
            teamFunctionalRole,
            createdBy
        });
        const savedTeam = await newTeam.save();

        const newTeamMember = new TeamMember({
            teamId: savedTeam._id,
            userId: leaderId,
            functionalRole: "Leader", // Changed from "leader" to valid enum or null
        });
        await newTeamMember.save();

        await User.findOneAndUpdate({ _id: leaderId }, { systemRole: "leader" });
        res.status(201).json({
            id: savedTeam._id,
            teamName: savedTeam.teamName,
            leaderId: savedTeam.leaderId,
            project: savedTeam.project,
            teamDescription: savedTeam.teamDescription,
            teamFunctionalRole: savedTeam.teamFunctionalRole,
            createdBy: savedTeam.createdBy
        });
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: error.message || "Server error while creating team." });
    }
};

//need teamId from req.params
exports.getTeamDetails = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required." });
        }
        const teamData = await Team.findById(teamId);
        if (!teamData) {
            return res.status(404).json({ message: "Team not found." });
        }

        const teamMembers = await TeamMember.find({ teamId }).populate("userId", "name email systemRole");
        const teamStatsData = await TeamStats.find({ teamId });
        const teamTasksData = await Task.find({ teamId }).limit(5).sort({ updatedAt: -1 });
        const recentMeetings = await Meeting.find({ teamId }).sort({ meetingDate: -1 }).limit(5);


        res.status(200).json({
            id: teamData._id,
            teamName: teamData.teamName,
            leaderId: teamData.leaderId,
            project: teamData.project,
            teamDescription: teamData.teamDescription,
            teamFunctionalRole: teamData.teamFunctionalRole,
            createdBy: teamData.createdBy,
            members: teamMembers.map(member => ({
                id: member.userId ? member.userId._id : null,
                name: member.userId ? member.userId.name : "Unknown",
                email: member.userId ? member.userId.email : null,
                systemRole: member.userId ? member.userId.systemRole : null,
                functionalRole: member.functionalRole
            })),
            teamStats: teamStatsData,
            recentTasks: teamTasksData,
            recentMeetings: recentMeetings
        });
    } catch (error) {
        console.error("Error fetching team details:", error);
        res.status(500).json({ message: error.message || "Server error while fetching team details." });
    }
};

//need teamId from req.params
//need userEmail, systemRole from req.body
//need id from req.user
exports.addTeamMember = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { userEmail, systemRole } = req.body;
        const addedBy = req.user.id;
        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required." });
        }
        if (!userEmail) {
            return res.status(400).json({ message: "User email is required." });
        }

        if (systemRole !== "member") {
            return res.status(400).json({ message: "Invalid system role." });
        }

        // Check if user exists first to get the ID
        const userData = await User.findOne({ email: userEmail, workspaceId: req.user.workspaceId, systemRole: "member" });
        if (!userData) {
            return res.status(404).json({ message: "User not found in the workspace." });
        }
        const userId = userData._id;

        // Check if the user is already a member of the team
        const existingTeamMember = await TeamMember.findOne({ teamId, userId });
        if (existingTeamMember) {
            return res.status(400).json({ message: "User is already a member of the team." });
        }

        //update user status
        await User.findByIdAndUpdate(userId, { status: true });

        //create team member entry
        const newTeamMember = new TeamMember({
            teamId,
            userId
        });
        await newTeamMember.save();

        res.status(201).json({ message: "User added to team successfully." });
    }
    catch (error) {
        console.error("Error adding user to team:", error);
        res.status(500).json({ message: error.message || "Server error while adding user to team." });
    }
};

//need teamId and userId from req.params
exports.removeTeamMember = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const userId = req.params.userId;
        if (!teamId || !userId) {
            return res.status(400).json({ message: "Team ID and User ID are required." });
        }

        //remove team member entry
        const removedMember = await TeamMember.findOneAndDelete({ teamId, userId });
        if (!removedMember) {
            return res.status(404).json({ message: "Team member not found." });
        }

        //update user  status to false
        await User.findOneAndUpdate({ _id: userId }, { status: false });

        res.status(200).json({ message: "User removed from team successfully." });
    }
    catch (error) {
        console.error("Error removing user from team:", error);
        res.status(500).json({ message: error.message || "Server error while removing user from team." });
    }
};

//need teamId from req.params
//need newLeaderEmail from req.body
//need workspaceId from req.user
exports.replaceTeamLeader = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { newLeaderEmail } = req.body;

        //check weather the newleader is registered as leader in systemrole
        const userData = await User.findOne({ email: newLeaderEmail, workspaceId: req.user.workspaceId });
        if (!userData) {
            return res.status(404).json({ message: "User not found in the workspace." });
        }
        const userId = userData._id;
        if (userData.systemRole !== "leader") {
            return res.status(400).json({ message: "User is not registered as leader in systemrole." });
        }

        const changedBy = req.user.id; // Assuming user ID is available in req.user
        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required in params." });
        }
        if (!newLeaderEmail) {
            return res.status(400).json({ message: "New leader email is required in body." });
        }

        const teamData = await Team.findById(teamId);
        if (!teamData) {
            return res.status(404).json({ message: "Team not found." });
        }
        const newLeaderData = await User.findOne({ email: newLeaderEmail, workspaceId: teamData.workspaceId });
        if (!newLeaderData) {
            return res.status(404).json({ message: "New leader not found in the workspace." });
        }

        //update old leader membership and status
        const oldLeaderId = teamData.leaderId;
        await TeamMember.findOneAndDelete({ teamId, userId: oldLeaderId });
        await User.findOneAndUpdate({ _id: oldLeaderId }, { status: false });
        //delete old leaders tasks

        //update team with new leader id
        userData.status = true;
        await userData.save();
        teamData.leaderId = newLeaderData._id;
        await teamData.save();
        await teamMember.create({ teamId, userId: newLeaderData._id, functionalRole: "Leader", addedBy: changedBy });

        res.status(200).json({
            message: "Team leader replaced successfully.",
            newLeader: {
                id: newLeaderData._id,
                name: newLeaderData.name,
                email: newLeaderData.email
            }
        });
    }
    catch (error) {
        console.error("Error replacing team leader:", error);
        res.status(500).json({ message: error.message || "Server error while replacing team leader." });
    }
};