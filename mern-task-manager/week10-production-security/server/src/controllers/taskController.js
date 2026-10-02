/**
 * @file src/controllers/taskController.js
 * @author Bill Chen
 * @description Week 10 — tasks for the authenticated user only.
 *   Validation now runs in middleware (see src/validators/taskValidators.js),
 *   so controllers assume the request body is well-formed.
 */

import { Task } from "../models/Task.js";

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

export async function getTask(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, completed } = req.body;
    const task = await Task.create({
      title,
      description,
      completed,
      userId: req.user.id,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { title, description, completed } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, description, completed },
      { new: true, runValidators: true, omitUndefined: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}
