// models/suggestion.model.js
const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema(
  {
    momId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MOM",
      required: true,
      index: true,
    },
    suggestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    suggestionText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Suggestion", suggestionSchema);
