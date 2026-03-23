// models/mom.model.js
const mongoose = require("mongoose");

const momSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
      unique: true
    },
    summary: {
      type: String,
      required: true
    },
    decisions: {
      type: [String],
      default: []
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mom", momSchema);
