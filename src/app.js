// src/app.js
const express = require("express");
// const cors = require("cors");
// const morgan = require("morgan");
const parser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error.middleware");


// route imports (adjust paths as per your folders)
const { auth } = require("./middlewares/auth.middleware");
const authRoutes = require("./routes/auth/auth.routes");
const adminTeamRoutes = require("./routes/admin/team.routes");
const adminMainRoutes = require("./routes/admin/admin.routes");
const leaderMeetingRoutes = require("./routes/leader/meeting.routes");
const leaderMomRoutes = require("./routes/leader/mom.routes");
const leaderTaskRoutes = require("./routes/leader/task.routes");
const leaderTeamRoutes = require("./routes/leader/team.routes");
const memberRoutes = require("./routes/member/member.routes");
const profileRoutes = require("./routes/profile.routes");

const app = express();
app.use(cookieParser());

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));



app.get("/health", (req, res) => {
   res.status(200).json({
      success: true,
    message: "Server is healthy 🚀",
  });
});

/* =======================
   API ROUTES
======================= */

app.use("/auth", authRoutes);

// Admin Routes
app.use("/admin", adminMainRoutes);
app.use("/admin/teams", adminTeamRoutes);

// Leader Routes
app.use("/leader/meetings", leaderMeetingRoutes);
app.use("/leader/moms", leaderMomRoutes);
app.use("/leader/tasks", leaderTaskRoutes);
app.use("/leader/teams", leaderTeamRoutes);

// Member Routes
app.use("/member", memberRoutes);
app.use("/member/suggestions", require("./routes/member/suggestion.routes"));
app.use("/member/tasks", require("./routes/member/task.routes"));

app.use("/profile", profileRoutes);

app.use(errorMiddleware);

module.exports = app;
