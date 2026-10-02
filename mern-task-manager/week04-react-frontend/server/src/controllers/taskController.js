/**
 * @file src/controllers/taskController.js
 * @author Bill Chen
 * @description Task controllers backed by MongoDB via Mongoose.
 *   Same contract as Week 3.
 */
import mongoose from "mongoose";
import { Task } from "../models/Task.js";

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

/** GET /api/tasks — newest first. */
export async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

/** GET /api/tasks/:id */
export async function getTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid task id" });
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

/** POST /api/tasks */
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

/** PUT /api/tasks/:id */
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid task id" });
    const { title, description, completed } = req.body || {};
    const task = await Task.findByIdAndUpdate(
      id,
      { title, description, completed },
      { new: true, runValidators: true, omitUndefined: true },
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid task id" });
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}
