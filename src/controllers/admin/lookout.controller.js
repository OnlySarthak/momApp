const Team = require("../../models/team.model");
const TeamMember = require("../../models/teamMember.model");
const User = require("../../models/user.model");

//need workspaceId from req.user
exports.lookOutTeams = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const teams = await Team.find({ workspaceId });
        res.status(200).json({ success: true, data: teams });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

//need workspaceId from req.user
exports.lookOutTeamMembers = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const teamIds = await Team.find({ workspaceId }).select('_id');
        const teamMembers = await TeamMember.find({ teamId: { $in: teamIds }, functionalRole: { $ne: "Leader" } }).populate('userId', 'name email');
        res.status(200).json({ success: true, data: teamMembers });
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

//need workspaceId from req.user
exports.lookoutLeaders = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const leaders = await User.find({ workspaceId, systemRole: "leader", status: false }).select('-password').select('-password');
        res.status(200).json({ success: true, data: leaders });
    } catch (error) {
        console.error('Error fetching leaders:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};