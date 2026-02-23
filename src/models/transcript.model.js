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
    type: {
      type: String,
      enum: ["raw", "clean"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

transcriptSchema.index({ meetingId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Transcript", transcriptSchema);
