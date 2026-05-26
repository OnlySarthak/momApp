const MOM = require("../../models/mom.model");
const Task = require("../../models/task.model");
const Suggestion = require("../../models/suggestion.model");
const User = require("../../models/user.model");
const TeamMember = require("../../models/teamMember.model");
const { timeFrameToDate } = require("../../utils/timeFrameToData");
const { populateMomAttendees, populateMultipleMomsAttendees } = require("../../utils/momHelper");
const { populateMultipleTasksResponsible } = require("../../utils/taskHelper");

//need teamId from req.user
//need filter from req.query
exports.getMOMList = async (req, res) => {
  try {
    const teamId = req.user.teamId;

    const filter = req.query.filter || "today";
    const dateFilter = timeFrameToDate(filter);

    const moms = await MOM.find({
      teamId,
      createdAt: dateFilter
    }).sort({ createdAt: -1 });

    const populatedMoms = await populateMultipleMomsAttendees(moms);

    const momsWithAttendees = await Promise.all(populatedMoms.map(async (m) => {
      const totalTasks = await Task.countDocuments({ momId: m._id });
      return {
        ...m,
        totalTasks
      };
    }));

    res.json(momsWithAttendees);
  } catch (error) {
    console.error("Error fetching MOMs:", error);
    res.status(500).json({ message: "Failed to fetch MOMs" });
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

    const populatedMomDetails = await populateMomAttendees(momDetails);

    //pending tasks
    const pendingTasks = await Task.find({ momId: id, state: 'pending' }).lean();
    const populatedPendingTasks = await populateMultipleTasksResponsible(pendingTasks);
    //all tasks for export
    const allTasks = await Task.find({ momId: id }).lean();
    const populatedAllTasks = await populateMultipleTasksResponsible(allTasks);
    //suggestions
    const suggestions = await Suggestion.find({ momId: id })
      .populate('suggestedBy', 'name')
      .lean();

    res.status(200).json({ success: true, data: { ...populatedMomDetails, pendingTasks: populatedPendingTasks, allTasks: populatedAllTasks, suggestions } });
  } catch (error) {
    console.error('Error fetching MOM details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//need id from req.params(suggestionId)
exports.approveSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const suggestionDetails = await Suggestion.findOneAndUpdate(
      { _id: id },
      { $set: { status: 'accepted' } },
      { new: true }
    ).lean();

    if (!suggestionDetails) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }

    res.status(200).json({ success: true, data: suggestionDetails });
  } catch (error) {
    console.error('Error approving suggestion:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//need id from req.params(suggestionId)
exports.rejectSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const suggestionDetails = await Suggestion.findOneAndUpdate(
      { _id: id },
      { $set: { status: 'rejected' } },
      { new: true }
    ).lean();

    if (!suggestionDetails) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }

    res.status(200).json({ success: true, data: suggestionDetails });
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//need id from req.params(momId)
//need summery,decisions,insights,presentAttendees from req.body
exports.editMOM = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      summery,
      decisions,
      insights,
      presentAttendees,
    } = req.body;

    // We don't need to re-fetch users. The frontend sends back the filtered array of objects 
    // which already contains the required properties (userId, name, functionalRole) set during creation.

    const attendeesToSave = Array.isArray(presentAttendees)
      ? presentAttendees.map(a => {
          if (typeof a === 'string') return { userId: a };
          if (a && a.userId) return { userId: a.userId };
          return null;
        }).filter(Boolean)
      : [];

    const updatedMOM = await MOM.findByIdAndUpdate(id, {
      summary: summery,
      decisions: decisions,
      insights: insights,
      presentAttendees: attendeesToSave,
    }, { new: true }).lean();

    const populatedUpdatedMOM = await populateMomAttendees(updatedMOM);

    res.status(200).json({ success: true, data: populatedUpdatedMOM });
  } catch (error) {
    console.error('Error editing MOM:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
