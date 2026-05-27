const { Queue, Worker } = require("bullmq");
const { startMeetingProcessingInBackground } = require("../utils/meetingHelper");
const Meeting = require("../models/meeting.model");

const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
};

let meetingQueue;
let meetingWorker;

function initMeetingQueue() {
  meetingQueue = new Queue("meeting-processing", {
    connection: redisConnection,
  });

  meetingQueue.on("error", (err) => {
    console.error("❌ [BullMQ] Queue connection error:", err.message);
  });

  meetingWorker = new Worker(
    "meeting-processing",
    async (job) => {
      const { meetingId, audioFileUrl } = job.data;
      console.log(`[BullMQ] Processing meeting job ${job.id} for meetingId: ${meetingId}`);

      // Update meeting stage to processing
      await Meeting.findByIdAndUpdate(meetingId, {
        processingStage: "processing"
      });

      // Execute AI processing
      await startMeetingProcessingInBackground(meetingId, audioFileUrl);
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY || "2", 10),
    }
  );

  meetingWorker.on("error", (err) => {
    console.error("❌ [BullMQ] Worker connection error:", err.message);
  });

  meetingWorker.on("completed", (job) => {
    console.log(`[BullMQ] Job ${job.id} completed successfully!`);
  });

  meetingWorker.on("failed", (job, err) => {
    console.error(`[BullMQ] Job ${job ? job.id : "unknown"} failed:`, err);
  });

  console.log("[BullMQ] Meeting processing queue and worker initialized.");
}

async function addMeetingToQueue(meetingId, audioFileUrl) {
  if (!meetingQueue) {
    throw new Error("Meeting queue not initialized. Call initMeetingQueue first.");
  }
  await meetingQueue.add(
    "process-meeting",
    { meetingId, audioFileUrl },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

module.exports = {
  initMeetingQueue,
  addMeetingToQueue,
};
