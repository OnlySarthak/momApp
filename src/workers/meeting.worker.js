const { Worker } = require("bullmq");
const connection = require("../config/redis");

const Meeting = require("../models/meeting.model");

// 🔴 TODO: replace with real AI calls
async function getRawTranscript(audioUrl) {
  // call your AI here
  return "RAW TRANSCRIPT TEXT";
}

async function getRefinedTranscript(rawText) {
  return "REFINED TRANSCRIPT";
}

async function getFinalSummary(refinedText) {
  return {
    summary: "FINAL SUMMARY",
    tasks: [],
    participants: [],
  };
}

const worker = new Worker(
  "meeting-processing",
  async (job) => {
    const { meetingId } = job.data;

    console.log("🚀 Processing meeting:", meetingId);

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    try {
      // =============================
      // STAGE 1 — Transcribing
      // =============================
      meeting.processingStage = "transcribing";
      await meeting.save();

      const rawTranscript = await getRawTranscript(
        meeting.audioFileUrl
      );

      meeting.rawTranscript = rawTranscript;
      await meeting.save();

      // =============================
      // STAGE 2 — Refining
      // =============================
      meeting.processingStage = "refining";
      await meeting.save();

      const refinedTranscript = await getRefinedTranscript(
        rawTranscript
      );

      meeting.refinedTranscript = refinedTranscript;
      await meeting.save();

      // =============================
      // STAGE 3 — Final summary
      // =============================
      meeting.processingStage = "summarizing";
      await meeting.save();

      const finalOutput = await getFinalSummary(
        refinedTranscript
      );

      meeting.finalSummary = finalOutput.summary;
      meeting.meetingTasks = finalOutput.tasks;
      meeting.participants = finalOutput.participants;

      meeting.processingStage = "completed";
      meeting.status = "completed";

      await meeting.save();

      console.log("✅ Meeting completed:", meetingId);
    } catch (err) {
      console.error("❌ Worker failed:", err);

      meeting.processingStage = "failed";
      meeting.status = "scheduled";
      await meeting.save();

      throw err; // important for BullMQ retries
    }
  },
  {
    connection,
    concurrency: 3, // process 3 meetings in parallel
  }
);

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`💥 Job ${job.id} failed:`, err.message);
});

console.log("👷 Meeting worker started...");