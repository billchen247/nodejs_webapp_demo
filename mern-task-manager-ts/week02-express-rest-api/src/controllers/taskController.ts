/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: src/controllers/taskController.ts
 *
 * Controllers are the "glue" between HTTP and the data layer.
 *
 * Design rule we follow:
 *   - Controllers deal with req/res, status codes, and shaping the response.
 *   - They do NOT contain business logic — they call into src/data/tasks.ts.
 *
 * This separation is what will let us keep most of this code intact when
 * we swap the in-memory store for MongoDB in Week 3.
 */
import type { Request, Response } from "express";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTaskById,
  updateTask,
  type NewTaskInput,
  type TaskUpdateInput,
} from "../data/tasks.js";

/**
 * Small helper for the common "turn :id into a number or 400" pattern.
 *
 * Why a helper?
 *   Every single endpoint that accepts :id needs to do this check. Repeating
 *   it inline would be noise, and getting it wrong (treating NaN as 0) would
 *   be a subtle bug.
 */
function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid task id", id: req.params.id });
    return null;
  }
  return id;
}

export function listTasks(_req: Request, res: Response): void {
  res.status(200).json(getAllTasks());
}

export function readTask(req: Request, res: Response): void {
  const id = parseId(req, res);
  if (id === null) return;

  const task = getTaskById(id);
  if (!task) {
    // 404 = the resource does not exist. In Week 7 we will introduce 401
    // and 403 and students will see the full status-code vocabulary.
    res.status(404).json({ error: "Task not found", id });
    return;
  }
  res.status(200).json(task);
}

export function addTask(req: Request, res: Response): void {
  // Minimal input validation. Mongoose will take over schema validation in Week 3,
  // but here we show students that the first line of defense is in the controller.
  const body = req.body as Partial<NewTaskInput>;
  if (!body || typeof body.title !== "string" || body.title.trim() === "") {
    res.status(400).json({ error: "A non-empty title is required" });
    return;
  }

  const task = createTask({
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description : "",
    completed: typeof body.completed === "boolean" ? body.completed : false,
  });

  // 201 Created is the correct status for a successful POST that creates a
  // resource. Returning the created record (with its new id) lets the client
  // show the result without a second GET.
  res.status(201).json(task);
}

export function editTask(req: Request, res: Response): void {
  const id = parseId(req, res);
  if (id === null) return;

  const body = (req.body ?? {}) as TaskUpdateInput;

  // Build a safe patch object. We only forward recognised fields.
  // Anything else (such as a client-supplied `id`) is silently dropped.
  const patch: TaskUpdateInput = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.completed === "boolean") patch.completed = body.completed;

  const updated = updateTask(id, patch);
  if (!updated) {
    res.status(404).json({ error: "Task not found", id });
    return;
  }
  res.status(200).json(updated);
}

export function removeTask(req: Request, res: Response): void {
  const id = parseId(req, res);
  if (id === null) return;

  const deleted = deleteTask(id);
  if (!deleted) {
    res.status(404).json({ error: "Task not found", id });
    return;
  }
  // 204 No Content is the standard "success, nothing to return" response.
  res.status(204).end();
}
