const User = require("../../models/user.model");
const Workspace = require("../../models/workspace.model");
const TeamMember = require("../../models/teamMember.model");
const Team = require("../../models/team.model");

//need userId from req.user
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const userProfile = await User.findById(userId).select('-password').lean();

        if (!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        const workspace = await Workspace.findById(userProfile.workspaceId).select('name').lean();
        userProfile.workspaceName = workspace ? workspace.name : null;

        //if user is not admin and non bench then attach team name to profile
        if (userProfile.systemRole !== "admin" && userProfile.systemRole !== "bench") {
            const teamMemberInfo = await TeamMember.findOne({ userId }).lean();
            if (teamMemberInfo) {
                const team = await Team.findById(teamMemberInfo.teamId).select('name').lean();
                userProfile.teamName = team ? team.name : null;
            } else {
                userProfile.teamName = null;
            }
        }

        res.json(userProfile);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Failed to fetch user profile" });
    }
};

//need userId from req.user
//need currentPassword and newPassword from req.body
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = await User.find
            .findById(userId)
            .select('+password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};