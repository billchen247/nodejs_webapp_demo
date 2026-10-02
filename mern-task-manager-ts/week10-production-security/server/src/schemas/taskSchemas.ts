/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/schemas/taskSchemas.ts
 *
 * Zod schemas + inferred TS types for task + user admin endpoints.
 * `.strict()` means an unexpected field is a validation error, not a
 * silently stripped one — a safe default that catches typos in the
 * client and probing from attackers.
 */
import { z } from "zod";
import { USER_ROLES } from "../models/User.js";

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(2000).optional(),
    completed: z.boolean().optional(),
  })
  .strict();

/** Update is a partial — any subset of these three fields. */
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    completed: z.boolean().optional(),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    role: z.enum(USER_ROLES),
  })
  .strict();

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>;
