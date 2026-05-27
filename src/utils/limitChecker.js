const Workspace = require("../models/workspace.model");
const User = require("../models/user.model");
const Team = require("../models/team.model");
const TeamMember = require("../models/teamMember.model");
const Meeting = require("../models/meeting.model");
const Suggestion = require("../models/suggestion.model");
const Task = require("../models/task.model");
const { LIMITS } = require("../config/limit");
const LimitExceededError = require("./LimitExceededError");

const checkNoOfUserPerWorkspace = async (workspaceId) => {
    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            throw new Error("Workspace not found");
        }
        const count = await User.countDocuments({ workspaceId, isDeleted: { $ne: true } });
        if (count >= LIMITS.MAX_USER_PER_WORKSPACE) {
            throw new LimitExceededError(
                `User limit reached. Maximum ${LIMITS.MAX_USER_PER_WORKSPACE} users allowed per workspace.`,
                "MAX_USER_PER_WORKSPACE",
                LIMITS.MAX_USER_PER_WORKSPACE,
                count
            );
        }
        return true;
    } catch (error) {
        throw error;
    }
}

const checkNoOfTeamsPerWorkspace = async (workspaceId) => {
    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            throw new Error("Workspace not found");
        }
        const count = await Team.countDocuments({ workspaceId });
        if (count >= LIMITS.MAX_TEAMS_PER_WORKSPACE) {
            throw new LimitExceededError(
                `Team limit reached. Maximum ${LIMITS.MAX_TEAMS_PER_WORKSPACE} teams allowed per workspace.`,
                "MAX_TEAMS_PER_WORKSPACE",
                LIMITS.MAX_TEAMS_PER_WORKSPACE,
                count
            );
        }
        return true;
    } catch (error) {
        throw error;
    }
}

const checkNoOfTeamMembersPerTeam = async (teamId) => {
    try {
        const team = await Team.findById(teamId);
        if (!team) {
            throw new Error("Team not found");
        }
        const count = await TeamMember.countDocuments({ teamId, isDeleted: { $ne: true } });
        if (count >= LIMITS.MAX_TEAM_MEMBERS_PER_TEAM) {
            throw new LimitExceededError(
                `Team member limit reached. Maximum ${LIMITS.MAX_TEAM_MEMBERS_PER_TEAM} members allowed per team.`,
                "MAX_TEAM_MEMBERS_PER_TEAM",
                LIMITS.MAX_TEAM_MEMBERS_PER_TEAM,
                count
            );
        }
        return true;
    } catch (error) {
        throw error;
    }
}

const checkNoOfSuggestionsPerMeeting = async (momId) => {
    try {
        const count = await Suggestion.countDocuments({ momId });
        if (count >= LIMITS.MAX_SUGGESTIONS_PER_MEETING) {
            throw new LimitExceededError(
                `Suggestion limit reached. Maximum ${LIMITS.MAX_SUGGESTIONS_PER_MEETING} suggestions allowed per MOM.`,
                "MAX_SUGGESTIONS_PER_MEETING",
                LIMITS.MAX_SUGGESTIONS_PER_MEETING,
                count
            );
        }
        return true;
    } catch (error) {
        throw error;
    }
}

const checkNoOfMeetingsPerWorkspace = async (workspaceId) => {
    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            throw new Error("Workspace not found");
        }
        const count = await Meeting.countDocuments({ workspaceId });
        if (count >= LIMITS.MAX_MEETINGS_PER_WORKSPACE) {
            throw new LimitExceededError(
                `Meeting limit reached. Maximum ${LIMITS.MAX_MEETINGS_PER_WORKSPACE} meetings allowed per workspace.`,
                "MAX_MEETINGS_PER_WORKSPACE",
                LIMITS.MAX_MEETINGS_PER_WORKSPACE,
                count
            );
        }
        return true;
    } catch (error) {
        throw error;
    }
}

const checkNoOfTasksPerUser = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const count = await Task.countDocuments({ responsibleId: userId });
        if (count >= LIMITS.MAX_TASKS_PER_USER) {
            throw new LimitExceededError(
                `Task limit reached. Maximum ${LIMITS.MAX_TASKS_PER_USER} tasks allowed per user.`,
                "MAX_TASKS_PER_USER",
                LIMITS.MAX_TASKS_PER_USER,
                count
            );
        }
        return true;
    } catch (error) {
        throw error;
    }
}

module.exports = { checkNoOfUserPerWorkspace, checkNoOfTeamsPerWorkspace, checkNoOfTeamMembersPerTeam, checkNoOfSuggestionsPerMeeting, checkNoOfMeetingsPerWorkspace, checkNoOfTasksPerUser };