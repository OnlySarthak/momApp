const MOM = require("../../models/mom.model");
const Task = require("../../models/task.model");
const Suggestion = require("../../models/suggestion.model");
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
      const totalTasks = await taskModel.countDocuments({ momId: m._id });
      const attendees = await momModel.find({ meetingId: m._id }).select('presentAttendees.name -_id');
      return {
        ...m.toObject(),
        attendees,
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
    const suggestions = await Suggestion.find({ momId: id }).lean();


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

    presentAttendees.forEach(attendee => {
      const user = User.findById(attendee._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const teamMember = TeamMember.findOne({ userId: attendee._id });
      if (!teamMember) {
        return res.status(404).json({ success: false, message: 'Team member not found' });
      }

      attendee.userId = attendee._id;
      attendee.name = user.name;
      attendee.functionalRole = teamMember.functionalRole;
    });

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
