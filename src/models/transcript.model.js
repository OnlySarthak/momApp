// models/transcript.model.js
const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    MOMId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mom",
      required: true,
      index: true,
    },
    content: {
      type: [
        {
          speaker: String,
          text: String,
          timestamp: Time,
        },
      ]
    },
  },
  { timestamps: true }
);

transcriptSchema.index({ meetingId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Transcript", transcriptSchema);
