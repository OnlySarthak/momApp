// models/teamMember.model.js
const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    functionalRole: {
      type: String,
      enum: ["developer", "designer", "tester", "leader", "other", null],
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 🚨 prevents duplicate team members
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
