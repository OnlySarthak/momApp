const team = require("../../models/team.model");
//get all team list of a workspace
const teamMember = require("../../models/teamMember.model");
const teamStats = require("../../models/teamStats.model");
const user = require("../../models/user.model");

exports.getTeamsList = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required in cookies." });
        }

        const teams = await team.find({ workspaceId });
        const teamDetails = await Promise.all(teams.map(async (team) => {
            const MembersNames = await teamMember.find({ teamId: team._id }).populate("userId", "name");
            const teamTaskData = await teamStats.findOne({ teamId: team._id }).select("TeamProductivityScore totalTasksCompleted");

            return {
                id: team._id,
                teamName: team.teamName,
                leaderId: team.leaderId,
                createdBy: team.createdBy,
                TeamProductivityScore: teamTaskData ? teamTaskData.TeamProductivityScore : 0,
                totalTasksCompleted: teamTaskData ? teamTaskData.totalTasksCompleted : 0,
                members: MembersNames.map(member => member.userId.name)
            };
        }));
        
        res.status(200).json({ teams: teamDetails });
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: error.message || "Server error while fetching teams." });
    }
};

exports.addTeam = async (req, res) => {
    try {
        const { teamName, leaderId, project, teamDescription, teamFunctionalRole } = req.body;
        const createdBy = req.user.id; // Assuming user ID is available in req.user
        const workspaceId = req.user.workspaceId; // Assuming workspace ID is available in req.user

        if (!teamName || !leaderId) {
            return res.status(400).json({ message: "Team name and leader ID are required." });
        }

        const newTeam = new team({
            workspaceId,
            teamName,
            leaderId,
            project,
            teamDescription,
            teamFunctionalRole,
            createdBy
        });
        const savedTeam = await newTeam.save();

        //add team leader as a member of the team
        const newTeamMember = new teamMember({
            teamId: savedTeam._id,
            userId: leaderId,
            functionalRole: "leader",
            addedBy: createdBy
        });
        await newTeamMember.save();
        //update user system role to leader
        await user.findOneAndUpdate({ _id: leaderId }, { systemRole: "leader" });
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

exports.getTeamDetails = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required in params." });
        }
        const teamData = await team.findById(teamId);
        if (!teamData) {
            return res.status(404).json({ message: "Team not found." });
        }

        const teamMembers = await teamMember.find({ teamId }).populate("userId", "name email systemRole");
        const teamStatsData = await teamStats.find({teamId});
        const teamTasksData = await task.find({ teamId }).limit(5).sort({ completedAt: -1 });
        const recentMeetings = await meeting.find({ teamId }).sort({ meetingDate: -1 }).limit(5);


        res.status(200).json({
            id: teamData._id,
            teamName: teamData.teamName,
            leaderId: teamData.leaderId,
            project: teamData.project,
            teamDescription: teamData.teamDescription,
            teamFunctionalRole: teamData.teamFunctionalRole,
            createdBy: teamData.createdBy,
            members: teamMembers.map(member => ({
                id: member.userId._id,
                name: member.userId.name,
                email: member.userId.email,
                systemRole: member.userId.systemRole,
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

exports.addTeamMember = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { userEmail, systemRole } = req.body;
        const addedBy = req.user.id; // Assuming user ID is available in req.user
        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required in params." });
        }
        if (!userEmail) {
            return res.status(400).json({ message: "User email is required in body." });
        }

        if( (systemRole !== "member")){
            return res.status(400).json({ message: "Invalid system role. Please specify either 'member' or 'leader'." });
        }

        // Check if the user is already a member of the team
        const existingTeamMember = await teamMember.findOne({ teamId, userId });
        if (existingTeamMember) {
            return res.status(400).json({ message: "User is already a member of the team." });
        }

        //update user
        const userData = await user.findOneAndUpdate({ email: userEmail, workspaceId: req.user.workspaceId }, { status: true });
        if (!userData) {
            return res.status(404).json({ message: "User not found in the workspace." });
        }
        const userId = userData._id;

        //create team member entry
        const newTeamMember = new teamMember({
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

exports.removeTeamMember = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const userId = req.params.userId;
        if (!teamId || !userId) {
            return res.status(400).json({ message: "Team ID and User ID are required in params." });
        }

        //remove team member entry
        const removedMember = await teamMember.findOneAndDelete({ teamId, userId });
        if (!removedMember) {
            return res.status(404).json({ message: "Team member not found." });
        }

        //update user  status to false
        const updatedUser = await user.findOneAndUpdate({ _id: userId }, { status: false });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "User removed from team successfully." });
    }
    catch (error) {
        console.error("Error removing user from team:", error);
        res.status(500).json({ message: error.message || "Server error while removing user from team." });
    }   
};

exports.replaceTeamLeader = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { newLeaderEmail } = req.body;
        const changedBy = req.user.id; // Assuming user ID is available in req.user
        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required in params." });
        }
        if (!newLeaderEmail) {
            return res.status(400).json({ message: "New leader email is required in body." });
        }

        const teamData = await team.findById(teamId);
        if (!teamData) {
            return res.status(404).json({ message: "Team not found." });
        }
        const newLeaderData = await user.findOne({ email: newLeaderEmail, workspaceId: teamData.workspaceId });
        if (!newLeaderData) {
            return res.status(404).json({ message: "New leader not found in the workspace." });
        }

        //update old leader membership and status
        const oldLeaderId = teamData.leaderId;
        await teamMember.findOneAndDelete({ teamId, userId: oldLeaderId });
        await user.findOneAndUpdate({ _id: oldLeaderId }, { status: false });

        //update team with new leader id
        await user.findOneAndUpdate({ _id: newLeaderData._id }, { status: true });
        await team.findOneAndUpdate({ _id: teamId }, { leaderId: newLeaderData._id });
        await teamMember.create({ teamId, userId: newLeaderData._id, functionalRole: "leader", addedBy: changedBy });

        res.status(200).json({ message: "Team leader replaced successfully." ,
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