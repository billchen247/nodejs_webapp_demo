/**
 * @file src/controllers/taskController.js
 * @author Bill Chen
 * @description Task controllers for Week 2.
 *
 * Controllers hold the "what to do" logic for each endpoint. The routes
 * file just wires URLs to these functions. This separation keeps the
 * route file short and makes handlers easy to find and unit-test.
 *
 * Each handler receives Express's `req` and `res` objects. Return a
 * response by calling `res.status(code).json(payload)`.
 */
import { tasks, nextId } from "../data/tasks.js";

/** GET /api/tasks — list every task currently in memory. */
export function listTasks(req, res) {
  res.status(200).json(tasks);
}

/** GET /api/tasks/:id — fetch a single task by numeric id. */
export function getTask(req, res) {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.status(200).json(task);
}

/**
 * POST /api/tasks — create a new task.
 * Expects a JSON body with at least `title`. `description` and
 * `completed` are optional. The id is generated server-side.
 */
export function createTask(req, res) {
  const { title, description = "", completed = false } = req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  const task = {
    id: nextId(),
    title,
    description,
    completed: Boolean(completed),
  };
  tasks.push(task);
  res.status(201).json(task);
}

/**
 * PUT /api/tasks/:id — update an existing task.
 * Only the fields present in the body are applied (partial update).
 */
export function updateTask(req, res) {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const { title, description, completed } = req.body || {};
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (completed !== undefined) task.completed = Boolean(completed);
  res.status(200).json(task);
}

/** DELETE /api/tasks/:id — remove a task and return the deleted body. */
export function deleteTask(req, res) {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const [removed] = tasks.splice(index, 1);
  res.status(200).json(removed);
}
