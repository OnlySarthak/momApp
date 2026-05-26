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
            const memberData = await TeamMember.find({ teamId: team._id, isDeleted: { $ne: true } }).populate("userId", "name");
            const teamTaskData = await TeamStats.findOne({ teamId: team._id }).select("TeamProductivityScore completedTasks");

            return {
                id: team._id,
                teamName: team.teamName,
                teamDescription: team.teamDescription,
                teamFunctionalRole: team.teamFunctionalRole,
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

        await User.findOneAndUpdate({ _id: leaderId }, { systemRole: "leader", status: true });

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

        const teamMembers = await TeamMember.find({ teamId, isDeleted: { $ne: true } }).populate("userId", "name email systemRole");
        const teamStatsData = await TeamStats.findOne({ teamId });
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
                functionalRole: member.functionalRole,
                isLeader: member.userId && teamData.leaderId && member.userId._id.toString() === teamData.leaderId.toString()
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
//need userId or userEmail from req.body
exports.addTeamMember = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { userId, userEmail } = req.body;

        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required." });
        }

        let user;
        if (userId) {
            user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
        } else if (userEmail) {
            user = await User.findOne({ email: userEmail, workspaceId: req.user.workspaceId, isDeleted: { $ne: true } });
        } else {
            return res.status(400).json({ message: "User ID or Email is required." });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if the user is already a member of the team
        const existingTeamMember = await TeamMember.findOne({ teamId, userId: user._id });
        if (existingTeamMember) {
            if (!existingTeamMember.isDeleted) {
                return res.status(400).json({ message: "User is already a member of this team." });
            }
            existingTeamMember.isDeleted = false;
            existingTeamMember.functionalRole = "Member";
            await existingTeamMember.save();
        } else {
            // Create team member entry - functionalRole defaults to "Member" in schema
            const newTeamMember = new TeamMember({
                teamId,
                userId: user._id
            });
            await newTeamMember.save();
        }

        res.status(201).json({ message: "User added to team successfully." });
    }
    catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ message: error.message || "Server error while adding member." });
    }
};



//need teamId and userId from req.params
exports.removeTeamMember = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const userId = req.params.userId;
        
        if (!teamId || !userId || userId === "undefined") {
            return res.status(400).json({ message: "Valid Team ID and User ID are required." });
        }

        // Remove team member entry
        const removedMember = await TeamMember.findOneAndUpdate({ teamId, userId, isDeleted: { $ne: true } }, { isDeleted: true }, { new: true });
        if (!removedMember) {
            return res.status(404).json({ message: "Team member not found." });
        }

        // Check if the user is a member of any OTHER teams
        const otherTeams = await TeamMember.findOne({ userId, teamId: { $ne: teamId }, isDeleted: { $ne: true } });
        if (!otherTeams) {
            // If they are not in any other teams, set status to false (inactive)
            await User.findByIdAndUpdate(userId, { status: false });
        }

        res.status(200).json({ message: "User removed from team successfully." });
    }
    catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: error.message || "Server error while removing member." });
    }
};



//need teamId from req.params
//need newLeaderEmail or newLeaderId from req.body
exports.replaceTeamLeader = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { newLeaderEmail, newLeaderId } = req.body;

        if (!teamId) {
            return res.status(400).json({ message: "Team ID is required." });
        }

        const teamData = await Team.findById(teamId);
        if (!teamData) {
            return res.status(404).json({ message: "Team not found." });
        }

        let newLeader;
        if (newLeaderId) {
            newLeader = await User.findById(newLeaderId);
        } else if (newLeaderEmail) {
            newLeader = await User.findOne({ email: newLeaderEmail, workspaceId: req.user.workspaceId });
        } else {
            return res.status(400).json({ message: "New leader ID or Email is required." });
        }

        if (!newLeader) {
            return res.status(404).json({ message: "New leader not found." });
        }

        if (newLeader.systemRole !== "leader") {
            return res.status(400).json({ message: "User is not registered as a leader." });
        }

        // 1. Handle Old Leader
        const oldLeaderId = teamData.leaderId;
        if (oldLeaderId) {
            await TeamMember.findOneAndUpdate({ teamId, userId: oldLeaderId, isDeleted: { $ne: true } }, { isDeleted: true });

            // Only deactivate if they aren't in any OTHER teams
            const otherTeams = await TeamMember.findOne({ userId: oldLeaderId, teamId: { $ne: teamId }, isDeleted: { $ne: true } });
            if (!otherTeams) {
                await User.findByIdAndUpdate(oldLeaderId, { status: false });
            }
        }

        // 2. Handle New Leader
        newLeader.status = true;
        await newLeader.save();

        // 3. Update Team Object
        teamData.leaderId = newLeader._id;
        await teamData.save();

        // 4. Create/Update TeamMember entry for new leader
        // Ensure they aren't already listed as a member in this team (to avoid duplicate index error)
        await TeamMember.findOneAndUpdate(
            { teamId, userId: newLeader._id },
            { functionalRole: "Leader", isDeleted: false },
            { upsert: true, new: true }
        );

        res.status(200).json({
            message: "Team leader replaced successfully.",
            newLeader: {
                id: newLeader._id,
                name: newLeader.name,
                email: newLeader.email
            }
        });
    }
    catch (error) {
        console.error("Error replacing team leader:", error);
        res.status(500).json({ message: error.message || "Server error while replacing team leader." });
    }
};
