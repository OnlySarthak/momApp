// models/meeting.model.js
const mongoose = require("mongoose");
const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      default: ""
    },
    agenda: {
      type: String,
      default: ""
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
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // leaderName: {
    //   type: String,
    //   required: true
    // },
    audioFileUrl: {
      type: String
    },
    meetingDate: {
      type: Date,
      required: true,
      index: true,
    },
    meetingDuration: {
      type: Number,
      default: 0
    },
    processingStage: {
      type: String,
      enum: [
        "initialized",
        "uploaded",
        "summarized",
        "failed"
      ],
      default: "initialized"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
