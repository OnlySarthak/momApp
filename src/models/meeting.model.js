// models/meeting.model.js
const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleInMeeting: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const meetingTaskSchema = new mongoose.Schema(
  {
    task: String,
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    state: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

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

    audioFileUrl: String,

    meetingDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "processing", "completed"],
      default: "scheduled",
    },

    participants: [participantSchema],
    meetingTasks: [meetingTaskSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
