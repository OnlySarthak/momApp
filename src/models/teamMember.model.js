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
      enum: ["Developer", "Designer", "QA Engineer", "DevOps", "Product Manager", "Tester",
        "Adviser", null],
      default: null,
    }
  },
  { timestamps: true }
);

// 🚨 prevents duplicate team members
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
