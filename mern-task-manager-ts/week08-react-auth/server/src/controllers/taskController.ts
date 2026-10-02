/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: server/src/controllers/taskController.ts
 *
 * Tasks are now scoped to the authenticated user.
 *
 * `requireAuth` guarantees `req.userId` before any of these controllers
 * runs, so we can trust it as a non-empty string.
 *
 * The 404-vs-403 policy
 *   When a user tries to read/update/delete a task they do not own, we
 *   respond 404, not 403. That is the common guidance: 403 ("you're not
 *   allowed to see this") implicitly confirms the resource exists, which
 *   is a mild info-disclosure to an attacker who is guessing ids.
 *   Returning 404 ("I don't know what you're talking about") says the
 *   same thing in a less revealing way.
 */
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task.js";

function requireUserId(req: Request): string {
  // Belt-and-braces check — the middleware should have ensured this. If
  // it is ever missing, the server has a routing bug, not an auth gap.
  if (!req.userId) {
    throw new Error("requireUserId: req.userId not set (routing bug)");
  }
  return req.userId;
}

function parseObjectId(req: Request, res: Response): string | null {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid task id", id });
    return null;
  }
  return id;
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
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
    const userId = requireUserId(req);
    const id = parseObjectId(req, res);
    if (id === null) return;

    const task = await Task.findOne({ _id: id, userId });
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
    const userId = requireUserId(req);
    const { title, description, completed } = (req.body ?? {}) as Record<string, unknown>;

    const task = await Task.create({
      title,
      description,
      completed,
      // Owner is pinned to the authenticated user — ignoring any
      // `userId` the client might have tried to send.
      userId,
    });

    res.status(201).json(task);
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

export async function editTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const id = parseObjectId(req, res);
    if (id === null) return;

    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.description === "string") patch.description = body.description;
    if (typeof body.completed === "boolean") patch.completed = body.completed;

    // The filter includes `userId` so a user cannot update someone else's
    // task even if they guess the id. `findOneAndUpdate` returns null if
    // no document matches both id *and* owner — we respond 404.
    const updated = await Task.findOneAndUpdate(
      { _id: id, userId },
      patch,
      { new: true, runValidators: true },
    );

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
    const userId = requireUserId(req);
    const id = parseObjectId(req, res);
    if (id === null) return;

    const deleted = await Task.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      res.status(404).json({ error: "Task not found", id });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
