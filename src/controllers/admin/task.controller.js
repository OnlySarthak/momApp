const task = require('../../models/task.model');
const MOM = require('../../models/mom.model');

exports.getTask = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const tasks = await task.find({ workspaceId })
            .populate('teamId', 'teamName project')
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getInProgressTasks = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const tasks = await task.find({ workspaceId, state: 'in_progress' })
            .populate('teamId', 'teamName project')
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: tasks });
    }
    catch (error) { 
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getCompletedTasks = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const tasks = await task.find({ workspaceId, state: 'completed' })
            .populate('teamId', 'teamName project')
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: tasks });
    }
    catch (error) { 
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getToDoTasks = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const tasks = await task.find({ workspaceId, state: 'pending' })
            .populate('teamId', 'teamName project')
            .limit(10)
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tasks });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getTasksByTeam = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const { teamId } = req.params;

        const tasks = await task.find({ workspaceId, teamId })
            .populate('teamId', 'teamName project')
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: tasks });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getTasksByMemberId = async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const { memberId } = req.params;

        const tasks = await task.find({ workspaceId, responsibleId: memberId })
            .populate('teamId', 'teamName project')
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: tasks });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
