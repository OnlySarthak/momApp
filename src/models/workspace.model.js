// models/workspace.model.js
const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
