const TeamMember = require("../../models/teamMember.model");

//need teamId from req.user
exports.lookOutTeamMembers = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const teamMembers = await TeamMember.find({ teamId, functionalRole: { $ne: "Leader" } }).populate('userId', 'name email');
        res.status(200).json({ success: true, data: teamMembers });
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};