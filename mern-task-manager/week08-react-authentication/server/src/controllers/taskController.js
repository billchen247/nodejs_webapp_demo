/**
 * @file src/controllers/taskController.js
 * @author Bill Chen
 * @description Week 7+ — all handlers now operate on the AUTHENTICATED
 *   user's tasks only.
 *
 * A few rules we follow throughout:
 *   1. The owner is ALWAYS req.user.id. We never trust req.body.userId.
 *   2. Every query is scoped by `{ _id, userId }`, so Alice can never
 *      see or touch Bob's task even if she guesses the id.
 *   3. If a task exists but belongs to someone else, we return 404
 *      (not 403). This hides the existence of other users' resources.
 */
import mongoose from "mongoose";
import { Task } from "../models/Task.js";

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/tasks — only my tasks.
export async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id — only if I own it.
export async function getTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const task = await Task.findOne({ _id: id, userId: req.user.id });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks — owner comes from the token.
export async function createTask(req, res, next) {
  try {
    const { title, description, completed } = req.body || {};
    const task = await Task.create({
      title,
      description,
      completed,
      userId: req.user.id, // server-controlled; never from req.body
    });
    res.status(201).json(task);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

// PUT /api/tasks/:id — only if I own it.
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const { title, description, completed } = req.body || {};
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
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

// DELETE /api/tasks/:id — only if I own it.
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}
