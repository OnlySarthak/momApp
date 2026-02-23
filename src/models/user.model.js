// models/user.model.js
const mongoose = require("mongoose");

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
      _id: user._id,
      email: user.email,
      systemRole: user.systemRole
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return token;
}

module.exports = mongoose.model("User", userSchema);
