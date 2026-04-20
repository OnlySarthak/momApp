const MOM = require("../../models/mom.model");
const Task = require("../../models/task.model");
const Suggestion = require("../../models/suggestion.model");
const User = require("../../models/user.model");
const TeamMember = require("../../models/teamMember.model");
const { timeFrameToDate } = require("../../utils/timeFrameToData");

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

    const momsWithAttendees = await Promise.all(moms.map(async (m) => {
      // Fixed: taskModel → Task, momModel → MOM
      const totalTasks = await Task.countDocuments({ momId: m._id });
      const momWithAttendees = await MOM.findById(m._id).select('presentAttendees -_id');
      return {
        ...m.toObject(),
        presentAttendees: momWithAttendees ? momWithAttendees.presentAttendees : [],
        totalTasks
      };
    }));

    res.json(momsWithAttendees);
  } catch (error) {
    console.error("Error fetching MOMs:", error);
    res.status(500).json({ message: "Failed to fetch MOMs" });
  }
};

//need id from req.params(momId )
exports.getMomDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const momDetails = await MOM.findById(id)
      .lean();

    if (!momDetails) {
      return res.status(404).json({ success: false, message: 'MOM not found' });
    }

    //pending tasks
    const pendingTasks = await Task.find({ momId: id, state: 'pending' }).lean();
    //suggestions
    const suggestions = await Suggestion.find({ momId: id })
      .populate('suggestedBy', 'name')
      .lean();

    res.status(200).json({ success: true, data: { ...momDetails, pendingTasks, suggestions } });
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

    const updatedMOM = await MOM.findByIdAndUpdate(id, {
      summary: summery,
      decisions: decisions,
      insights: insights,
      presentAttendees: presentAttendees,
    }, { new: true }).lean();

    res.status(200).json({ success: true, data: updatedMOM });
  } catch (error) {
    console.error('Error editing MOM:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
