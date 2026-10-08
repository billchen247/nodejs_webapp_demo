import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod/v4";

import Todo from "../models/todo.js";

type TodoIdParams = { id: string };

const todoInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  completed: z.boolean().default(false),
}).strict();

const todoPatchSchema = todoInputSchema.partial()
  .refine(todo => Object.keys(todo).length > 0, "At least one field must be provided");

function isValidTodoId(id: string): boolean {
  return mongoose.isObjectIdOrHexString(id);
}

export async function listTodos(_req: Request, res: Response): Promise<void> {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
}

export async function createTodo(req: Request, res: Response): Promise<void> {
  const result = todoInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid todo", issues: result.error.issues });
    return;
  }

  const todo = await Todo.create(result.data);
  res.location(`/api/v1/todos/${todo.id}`).status(201).json(todo);
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

  const todo = await Todo.findByIdAndUpdate(id, result.data, {
    new: true,
    runValidators: true,
  });
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

  const todo = await Todo.findByIdAndUpdate(id, { $set: result.data }, {
    new: true,
    runValidators: true,
  });
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
