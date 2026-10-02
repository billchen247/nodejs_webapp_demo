/**
 * @file src/models/Task.js
 * @author Bill Chen
 * @description A Mongoose model wraps a MongoDB collection with:
 *   - a schema (shape + validation)
 *   - a model (methods like .find, .findById, .create)
 *
 *   MongoDB documents live in a collection. The default collection name
 *   for this model is "tasks" (lowercase, pluralized).
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
  },
  {
    // Mongoose will add createdAt and updatedAt automatically.
    timestamps: true,
  }
);

export const Task = mongoose.model("Task", taskSchema);
