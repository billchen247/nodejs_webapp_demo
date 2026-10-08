import type { Request, Response } from "express";

import mongoose from "mongoose";

import Project from "../models/project.js";
import Todo from "../models/todo.js";
import {
  isValidTodoId,
  todoInputSchema,
  todoPatchSchema,
  todoQuerySchema,
} from "../schemas/todo.js";

type TodoIdParams = { id: string };

async function hasTodoTitle(title: string, excludingId?: string): Promise<boolean> {
  const filter = excludingId
    ? { title, _id: { $ne: new mongoose.Types.ObjectId(excludingId) } }
    : { title };
  return Boolean(await Todo.exists(filter));
}

function isDuplicateTodoTitleError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 11000) {
    return false;
  }

  return "keyPattern" in error
    && typeof error.keyPattern === "object"
    && error.keyPattern !== null
    && "title" in error.keyPattern;
}

function sendTodoTitleConflict(res: Response): void {
  res.status(409).json({ message: "Todo title already exists" });
}

async function hasExistingProject(projectId?: mongoose.Types.ObjectId): Promise<boolean> {
  return !projectId || Boolean(await Project.exists({ _id: projectId }));
}

function sendMissingProjectError(res: Response): void {
  res.status(400).json({
    message: "Invalid todo",
    issues: [{ code: "custom", path: ["projectId"], message: "Project does not exist" }],
  });
}

export async function listTodos(req: Request, res: Response): Promise<void> {
  const result = todoQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ message: "Invalid todo query", issues: result.error.issues });
    return;
  }

  const { title, ...filters } = result.data;
  const filter = title
    ? { ...filters, title: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    : filters;
  const todos = await Todo.find(filter).sort({ createdAt: -1 });
  res.json(todos);
}

export async function createTodo(req: Request, res: Response): Promise<void> {
  const result = todoInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid todo", issues: result.error.issues });
    return;
  }

  if (!await hasExistingProject(result.data.projectId)) {
    sendMissingProjectError(res);
    return;
  }

  if (await hasTodoTitle(result.data.title)) {
    sendTodoTitleConflict(res);
    return;
  }

  try {
    const todo = await Todo.create(result.data);
    res.location(`/api/v1/todos/${todo.id}`).status(201).json(todo);
  }
  catch (error) {
    if (isDuplicateTodoTitleError(error)) {
      sendTodoTitleConflict(res);
      return;
    }
    throw error;
  }
}

export async function getTodo(req: Request<TodoIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidTodoId(id)) {
    res.status(400).json({ message: "Invalid todo id" });
    return;
  }

  const todo = await Todo.findById(id);
  if (!todo) {
    res.status(404).json({ message: "Todo not found" });
    return;
  }

  res.json(todo);
}

export async function replaceTodo(req: Request<TodoIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidTodoId(id)) {
    res.status(400).json({ message: "Invalid todo id" });
    return;
  }

  const result = todoInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid todo", issues: result.error.issues });
    return;
  }

  if (!await hasExistingProject(result.data.projectId)) {
    sendMissingProjectError(res);
    return;
  }

  if (await hasTodoTitle(result.data.title, id)) {
    sendTodoTitleConflict(res);
    return;
  }

  let todo: Awaited<ReturnType<typeof Todo.findByIdAndUpdate>>;
  try {
    todo = await Todo.findByIdAndUpdate(id, result.data, {
      new: true,
      runValidators: true,
    });
  }
  catch (error) {
    if (isDuplicateTodoTitleError(error)) {
      sendTodoTitleConflict(res);
      return;
    }
    throw error;
  }

  if (!todo) {
    res.status(404).json({ message: "Todo not found" });
    return;
  }

  res.json(todo);
}

export async function updateTodo(req: Request<TodoIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidTodoId(id)) {
    res.status(400).json({ message: "Invalid todo id" });
    return;
  }

  const result = todoPatchSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid todo", issues: result.error.issues });
    return;
  }

  if (!await hasExistingProject(result.data.projectId)) {
    sendMissingProjectError(res);
    return;
  }

  if (result.data.title && await hasTodoTitle(result.data.title, id)) {
    sendTodoTitleConflict(res);
    return;
  }

  let todo: Awaited<ReturnType<typeof Todo.findByIdAndUpdate>>;
  try {
    todo = await Todo.findByIdAndUpdate(id, { $set: result.data }, {
      new: true,
      runValidators: true,
    });
  }
  catch (error) {
    if (isDuplicateTodoTitleError(error)) {
      sendTodoTitleConflict(res);
      return;
    }
    throw error;
  }

  if (!todo) {
    res.status(404).json({ message: "Todo not found" });
    return;
  }

  res.json(todo);
}

export async function deleteTodo(req: Request<TodoIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidTodoId(id)) {
    res.status(400).json({ message: "Invalid todo id" });
    return;
  }

  const todo = await Todo.findByIdAndDelete(id);
  if (!todo) {
    res.status(404).json({ message: "Todo not found" });
    return;
  }

  res.status(204).end();
}
