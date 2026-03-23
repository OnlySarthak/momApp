// models/meeting.model.js
const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
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
    audioFileUrl:{
        type: String,
        required: true
    } ,
    meetingDate: {
      type: Date,
      required: true,
      index: true,
    },
    processingStage: {
      type: String,
      enum: [
        "initialized",
        "uploaded",
        "summarized",
        "failed"
      ],
      default: "uploaded"
    },
    participants: {
      type: [participantSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
