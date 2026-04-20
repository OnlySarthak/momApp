// models/task.model.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    responsibleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resposibleName:{
      type: String,
      required: true
    },
    responsibleFunctionalRole:{
      type: String,
    },
    state: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    momId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mom",
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now
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

module.exports = mongoose.model("Task", taskSchema);
