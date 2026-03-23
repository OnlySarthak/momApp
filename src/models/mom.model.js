// models/mom.model.js
const mongoose = require("mongoose");

const momSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
      unique: true
    },
    summary: {
      type: String,
      required: true
    },
    decisions: {
      type: [String],
      default: []
    },
    activeMemberIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember"
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mom", momSchema);
