// models/task.model.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      index: true,
    },

    momId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mom",
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    description: String,

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
      index: true,
    },

    dueDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
