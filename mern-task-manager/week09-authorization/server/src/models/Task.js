/**
 * @file src/models/Task.js
 * @author Bill Chen
 * @description Week 7 — tasks are now owned by a user.
 *   The `userId` field is required and indexed for fast per-user queries.
 */
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      maxlength: [200, "title must be 200 characters or fewer"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "description must be 2000 characters or fewer"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // The owner. We never read this value from the request body — the server
    // sets it from req.user.id. See controllers.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
