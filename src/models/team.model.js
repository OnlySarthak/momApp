// models/team.model.js
const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamDescription: {
      type: String,
      default: "",
    },
    teamFunctionalRole: {
      type: String,
      enum: [
        "Engineering",
        "Marketing & Content",
        "Design",
        "Product",
        "Operations",
        "Sales / Business Development",
        "Research & Strategy"
      ],
      default: "Engineering",
    },
    project: {
      type: String,
      default: ""
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
