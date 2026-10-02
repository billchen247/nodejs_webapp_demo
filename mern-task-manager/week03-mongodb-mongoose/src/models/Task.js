/**
 * @file src/models/Task.js
 * @author Bill Chen
 * @description Mongoose model for a Task document.
 *
 * A Mongoose model wraps a MongoDB collection with:
 *   - a schema (shape + validation rules enforced before writes)
 *   - a model (methods like `.find`, `.findById`, `.create`, ...)
 *
 * MongoDB documents live in a collection; by convention Mongoose names
 * the collection after the model, lower-cased and pluralized. So the
 * "Task" model writes to the "tasks" collection.
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
    // Mongoose auto-manages createdAt / updatedAt — invaluable for
    // debugging and for "newest first" sorts.
    timestamps: true,
  }
);

export const Task = mongoose.model("Task", taskSchema);
