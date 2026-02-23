// models/teamStats.model.js
const mongoose = require("mongoose");

const teamStatsSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      unique: true,
    },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeamStats", teamStatsSchema);
