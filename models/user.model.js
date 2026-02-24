const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["child", "parent", "admin"], 
      default: "parent",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
