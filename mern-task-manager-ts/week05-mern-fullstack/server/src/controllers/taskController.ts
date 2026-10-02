/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: server/src/controllers/taskController.ts
 *
 * The controllers are shaped the same as in Week 2 — the big change is that
 * they now talk to Mongoose instead of an in-memory array.
 *
 * This file deliberately handles two kinds of errors differently:
 *   - "Known" errors (bad id, not found, validation failure) are translated
 *     into clean 400/404 responses here, in the controller.
 *   - "Unexpected" errors are passed to Express via `next(err)` so the
 *     central error handler in `app.ts` can log them and return 500.
 */
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task.js";

/**
 * Convert the `:id` path parameter into a MongoDB ObjectId or send 400.
 *
 * Returning `null` + having already written to `res` is a small trick that
 * keeps the happy path above readable (`if (!id) return;`).
 */
function parseObjectId(req: Request, res: Response): string | null {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid task id", id });
    return null;
  }
  return id;
}

export async function listTasks(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // `.sort({ createdAt: -1 })` returns newest-first, which is what a
    // task-list UI almost always wants.
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function readTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseObjectId(req, res);
    if (id === null) return;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found", id });
      return;
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function addTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // We whitelist fields. If the client sends `_id` or `createdAt` or
    // anything else, we silently drop it. The server owns those fields.
    const { title, description, completed } = (req.body ?? {}) as Record<string, unknown>;

    const task = await Task.create({
      title,
      description,
      completed,
    });

    res.status(201).json(task);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      // Turn Mongoose's validation failure into a clean 400 with field-level
      // messages. In Week 10 we will tighten this to avoid leaking internals.
      res.status(400).json({
        error: "Validation failed",
        details: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message]),
        ),
      });
      return;
    }
    next(err);
  }
}

export async function editTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseObjectId(req, res);
    if (id === null) return;

    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.description === "string") patch.description = body.description;
    if (typeof body.completed === "boolean") patch.completed = body.completed;

    // `new: true` → return the document AFTER applying the update.
    // `runValidators: true` → re-run schema validators on the update
    //   (Mongoose does NOT do this by default, which is a famous gotcha).
    const updated = await Task.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({ error: "Task not found", id });
      return;
    }

    res.status(200).json(updated);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        error: "Validation failed",
        details: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message]),
        ),
      });
      return;
    }
    next(err);
  }
}

export async function removeTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseObjectId(req, res);
    if (id === null) return;

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Task not found", id });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
