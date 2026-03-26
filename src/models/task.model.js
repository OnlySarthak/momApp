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
      required: true,
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
