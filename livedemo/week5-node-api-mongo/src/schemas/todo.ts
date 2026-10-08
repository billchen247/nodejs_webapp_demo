import mongoose from "mongoose";
import { z } from "zod/v4";

import { isValidProjectId } from "./project.js";

export const todoInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  projectId: z.string()
    .refine(isValidProjectId, "Invalid project id")
    .transform(projectId => new mongoose.Types.ObjectId(projectId))
    .optional(),
  completed: z.boolean().default(false),
}).strict();

export const todoPatchSchema = todoInputSchema.partial()
  .refine(todo => Object.keys(todo).length > 0, "At least one field must be provided");

export const todoQuerySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  completed: z.enum(["true", "false"]).transform(value => value === "true").optional(),
  projectId: z.string()
    .refine(isValidProjectId, "Invalid project id")
    .transform(projectId => new mongoose.Types.ObjectId(projectId))
    .optional(),
}).strict();

export function isValidTodoId(id: string): boolean {
  return mongoose.isObjectIdOrHexString(id);
}
