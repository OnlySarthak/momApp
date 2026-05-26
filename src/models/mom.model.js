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
    MeetingTitle: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    decisions: {
      type: [String],
      default: []
    },
    insights: {
      type: String,
      default: []
    },
    contextLable : {
      type: String,
      default: []
    },
    presentAttendees: {
      type: [{
        userId : {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      }],
      default: []
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mom", momSchema);
