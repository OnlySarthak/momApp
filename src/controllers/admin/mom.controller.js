const Meeting = require('../../models/meeting.model');
const MOM = require('../../models/mom.model');
const Task = require('../../models/task.model');
const Suggestion = require('../../models/suggestion.model');
const { timeFrameToDate } = require('../../utils/timeFrameToData');

//need workspaceId from req.user
exports.getMomList = async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
    const { timeframe } = req.query;

    const dateRange = timeFrameToDate(timeframe);

    // Find all MOMs for the given workspaceId, count the number of tasks associated with each MOM and add to that mom document
    const moms = await MOM.find({ workspaceId, createdAt: dateRange })
      .sort({ createdAt: -1 })
      .populate('meetingId', 'title') // Populate meeting title
      .lean(); // Use lean() to get plain JavaScript objects

    // For each MOM, count the number of tasks associated with it
    const momsWithTaskCount = await Promise.all(moms.map(async (mom) => {
      const taskCount = await Task.countDocuments({ momId: mom._id });
      return { ...mom, taskCount };
    }));

    res.status(200).json({ success: true, data: momsWithTaskCount });
  } catch (error) {
    console.error('Error fetching MOMs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getMomDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const momDetails = await MOM.findById(id)
      .populate('workspaceId', 'name')
      .populate('teamId', 'teamName')
      .populate('meetingId', 'title meetingDate meetingDuration leaderName projectName')
      .lean();

    if (!momDetails) {
      return res.status(404).json({ success: false, message: 'MOM not found' });
    }

    //pending tasks
    const pendingTasks = await Task.find({ momId: id, state: 'pending' }).lean();
    //all tasks for export
    const allTasks = await Task.find({ momId: id }).lean();
    //suggestions
    const suggestions = await Suggestion.find({ momId: id }).lean();

    res.status(200).json({ success: true, data: { ...momDetails, pendingTasks, allTasks, suggestions } });
  } catch (error) {
    console.error('Error fetching MOM details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

