/**
 * @file src/controllers/taskController.js
 * @author Bill Chen
 */
// Week 3 — the controllers now talk to MongoDB through Mongoose.
// Notice how little actually changes compared to the Week 2 controllers.
// The method names move from Array operations to Mongoose Model methods.

import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import {
  verifyAuthToken,
  AUTH_COOKIE_NAME,
} from "../config/auth.js";

// Helper: validate that the given id is a plausible MongoDB ObjectId.
// If it isn't, we can respond with 400 instead of letting Mongoose throw.
function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

async function authenticateTaskRequest(req, res) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }

  return true;
}

// GET /api/tasks — newest first.
export async function listTasks(req, res, next) {
  try {
    if (!(await authenticateTaskRequest(req, res))) return;

    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id
export async function getTask(req, res, next) {
  try {
    if (!(await authenticateTaskRequest(req, res))) return;

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

// POST /api/tasks
export async function createTask(req, res, next) {
  try {
    if (!(await authenticateTaskRequest(req, res))) return;

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

// PUT /api/tasks/:id
export async function updateTask(req, res, next) {
  try {
    if (!(await authenticateTaskRequest(req, res))) return;

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

// DELETE /api/tasks/:id
export async function deleteTask(req, res, next) {
  try {
    if (!(await authenticateTaskRequest(req, res))) return;

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
