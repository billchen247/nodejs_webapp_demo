/**
 * @file src/controllers/taskController.js
 * @author Bill Chen
 * @description Week 3 controllers — the controllers now talk to MongoDB
 *   through Mongoose. Notice how little actually changes compared to the
 *   Week 2 in-memory controllers: the array operations (`.find`, `.push`,
 *   `.splice`) are replaced by their Mongoose equivalents.
 *
 * All handlers are `async` because every database call returns a promise.
 * We funnel unexpected errors into `next(err)` so Express's error
 * middleware can turn them into a 500 response.
 */
import mongoose from "mongoose";
import { Task } from "../models/Task.js";

/**
 * Validate that the given id is a plausible MongoDB ObjectId. If a client
 * sends garbage we return 400 instead of letting Mongoose throw a 500.
 */
function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

/** GET /api/tasks — list all tasks, newest first. */
export async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

/** GET /api/tasks/:id — fetch a single task. */
export async function getTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks — create a new task. Mongoose will enforce the schema
 * validators (required, maxlength, etc.) before any write hits Mongo.
 */
export async function createTask(req, res, next) {
  try {
    const { title, description, completed } = req.body || {};
    const task = await Task.create({ title, description, completed });
    res.status(201).json(task);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * PUT /api/tasks/:id — partial update. `omitUndefined` tells Mongoose to
 * ignore fields the client didn't send instead of blanking them out.
 * `runValidators: true` means the schema rules apply to updates as well
 * as inserts (otherwise Mongoose would skip them by default).
 */
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const { title, description, completed } = req.body || {};
    const task = await Task.findByIdAndUpdate(
      id,
      { title, description, completed },
      { new: true, runValidators: true, omitUndefined: true }
    );
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

/** DELETE /api/tasks/:id — remove by id and return the deleted document. */
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}
