const Meeting = require('../../models/meeting.model');
const MOM = require('../../models/mom.model');
const Task = require('../../models/task.model');
const Suggestion = require('../../models/suggestion.model');
const User = require('../../models/user.model');
const { timeFrameToDate } = require('../../utils/timeFrameToData');
const { populateMomAttendees, populateMultipleMomsAttendees } = require('../../utils/momHelper');
const { populateMultipleTasksResponsible } = require('../../utils/taskHelper');

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

    const populatedMoms = await populateMultipleMomsAttendees(moms);

    // For each MOM, count the number of tasks associated with it
    const momsWithTaskCount = await Promise.all(populatedMoms.map(async (mom) => {
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
      .populate('teamId', 'teamName leaderId')
      .populate('meetingId', 'title meetingDate meetingDuration projectName ')//leaderName')
      .lean();

    if (!momDetails) {
      return res.status(404).json({ success: false, message: 'MOM not found' });
    }

    //get leader Name from team
    const leaderName = await User.findById(momDetails.teamId.leaderId).select('name').lean();
    momDetails.meetingId.leaderName = leaderName ? leaderName.name : 'Unknown';

    const populatedMomDetails = await populateMomAttendees(momDetails);

    //pending tasks
    const pendingTasks = await Task.find({ momId: id, state: 'pending' }).lean();
    const populatedPendingTasks = await populateMultipleTasksResponsible(pendingTasks);
    //all tasks for export
    const allTasks = await Task.find({ momId: id }).lean();
    const populatedAllTasks = await populateMultipleTasksResponsible(allTasks);
    //suggestions
    const suggestions = await Suggestion.find({ momId: id }).lean();

    res.status(200).json({ success: true, data: { ...populatedMomDetails, pendingTasks: populatedPendingTasks, allTasks: populatedAllTasks, suggestions } });
  } catch (error) {
    console.error('Error fetching MOM details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

