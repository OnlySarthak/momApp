require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
})

const app = require("./app");
const connectDB = require("./config/database");
const { initMeetingQueue } = require("./queues/meetingQueue");

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await connectDB();
    initMeetingQueue();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
