// src/app.js
const express = require("express");
// const cors = require("cors");
// const morgan = require("morgan");
const parser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error.middleware");


// route imports (adjust paths as per your folders)
const authRoutes = require("./routes/auth/auth.routes");
// const teamRoutes = require("./routes/admin/team.routes");
// const meetingRoutes = require("./routes/leader/meeting.routes");
// const taskRoutes = require("./routes/leader/task.routes");
// const suggestionRoutes = require("./routes/member/suggestion.routes");

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
// app.use("/api/admin/teams", teamRoutes);
// app.use("/api/leader/meetings", meetingRoutes);
// app.use("/api/leader/tasks", taskRoutes);
// app.use("/api/member/suggestions", suggestionRoutes)

app.use(errorMiddleware);

module.exports = app;
