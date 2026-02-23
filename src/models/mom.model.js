// models/mom.model.js
const mongoose = require("mongoose");

const momSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    summary: String,
    decisions: [String],
    generatedFromTranscriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transcript",
    },
    version: {
      type: Number,
      default: 1,
    },
    updatedByLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mom", momSchema);
