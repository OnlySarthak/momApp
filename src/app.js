// src/app.js
const express = require("express");
const cors = require("cors");
// const morgan = require("morgan");
const parser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error.middleware");

// Route imports
const authRoutes = require("./routes/auth/auth.routes");
const adminTeamRoutes = require("./routes/admin/team.routes");
const adminMainRoutes = require("./routes/admin/admin.routes");
const leaderMeetingRoutes = require("./routes/leader/meeting.routes");
const leaderMomRoutes = require("./routes/leader/mom.routes");
const leaderTaskRoutes = require("./routes/leader/task.routes");
const leaderTeamRoutes = require("./routes/leader/team.routes");
const leaderMainRoutes = require("./routes/leader/leader.routes");
const memberRoutes = require("./routes/member/member.routes");

const profileRoutes = require("./routes/profile.routes");

const app = express();

/* =======================
   CORS — must be FIRST
   Handles OPTIONS preflight before any auth check runs
======================= */




// Allow preflight OPTIONS for all routes
// NOTE: "*" is invalid in path-to-regexp v8 — use "(.*)" instead
app.use(cors({
   origin: "http://localhost:5173",
   credentials: true,
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

/* =======================
   HEALTH CHECK (public)
======================= */
app.get("/health", (req, res) => {
   res.status(200).json({
      success: true,
      message: "Server is healthy 🚀",
   });
});

/* =======================
   PUBLIC ROUTES — NO AUTH
   /auth/login and /auth/register are before router.use(auth)
   inside auth.routes.js so they remain public.
======================= */
app.use("/api/auth", authRoutes);

/* =======================
   PROTECTED ROUTES
   Auth is applied inside each route file, not globally here.
   IMPORTANT: More specific paths must come BEFORE less specific ones.
   e.g. /api/admin/teams BEFORE /api/admin  (to avoid param conflict)
======================= */

// Admin — teams router FIRST (specific), then general admin router
app.use("/api/admin/teams", adminTeamRoutes);
app.use("/api/admin", adminMainRoutes);

// Leader
app.use("/api/leader/meetings", leaderMeetingRoutes);
app.use("/api/leader/moms", leaderMomRoutes);
app.use("/api/leader/tasks", leaderTaskRoutes);
app.use("/api/leader/teams", leaderTeamRoutes);
app.use("/api/leader", leaderMainRoutes);


// Member — single router handles ALL member routes (/dashboard, /meetings,
// /moms, /moms/:id, /moms/:id/suggestions, /tasks, /tasks/filter)
// Do NOT mount member/task.routes or member/suggestion.routes separately
// as member.routes.js already includes those endpoints, and double-mounting
// causes "missing parameter name" path-to-regexp errors.
app.use("/api/member", memberRoutes);

// Profile
app.use("/api/profile", profileRoutes);

app.use(errorMiddleware);

module.exports = app;
