// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const errorMiddleware = require("./middlewares/error.middleware");

// route imports (adjust paths as per your folders)
const authRoutes = require("./routes/auth/auth.routes");
const teamRoutes = require("./routes/admin/team.routes");
const meetingRoutes = require("./routes/leader/meeting.routes");
const taskRoutes = require("./routes/leader/task.routes");
const suggestionRoutes = require("./routes/member/suggestion.routes");

const app = express();

/* =======================
   GLOBAL MIDDLEWARE
======================= */

// body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// cors
app.use(cors());

// logger
app.use(morgan("dev"));

/* =======================
   HEALTH CHECK
======================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
  });
});

/* =======================
   API ROUTES
======================= */

app.use("/api/auth", authRoutes);
app.use("/api/admin/teams", teamRoutes);
app.use("/api/leader/meetings", meetingRoutes);
app.use("/api/leader/tasks", taskRoutes);
app.use("/api/member/suggestions", suggestionRoutes);

/* =======================
   ERROR HANDLER (LAST)
======================= */

app.use(errorMiddleware);

module.exports = app;
