// models/user.model.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    systemRole: {
      type: String,
      enum: ["admin", "leader", "member"],
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);


userSchema.methods.generateAuthToken = function () {
  const user = this;
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      systemRole: user.systemRole,
      workspaceId: user.workspaceId,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return token;
}

module.exports = mongoose.model("User", userSchema);
