/* ---------------------------------------------------------------------------
 * src/schemas/task.ts
 *
 * Zod schemas for task create / edit / status-change forms.
 *
 * Notable transforms
 *   * `dueDate` — HTML `<input type="date">` submits "" when empty and
 *                 "YYYY-MM-DD" otherwise. Normalise to `Date | null`.
 *   * `assignee` — a `<select>` uses "" for the "unassigned" option. Normalise
 *                  to `null` so Mongoose stores a proper null.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";
import mongoose from "mongoose";
import { TASK_STATUSES, TASK_PRIORITIES } from "../models/task.js";

const titleField = z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters");

const descriptionField = z
    .string()
    .trim()
    .max(4000, "Description cannot exceed 4000 characters")
    .optional()
    .transform((v) => v ?? "");

const statusField = z.enum(TASK_STATUSES, {
    errorMap: () => ({ message: "Status must be one of: todo, in_progress, done" }),
});

const priorityField = z.enum(TASK_PRIORITIES, {
    errorMap: () => ({ message: "Priority must be one of: low, medium, high" }),
});

// "YYYY-MM-DD" from <input type="date">, or "" (unset) → null.
const dueDateField = z
    .union([z.string(), z.undefined()])
    .transform((v) => {
        if (v === undefined || v === null || v === "") return null;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
    });

// Empty <select> or "unassigned" both mean null. Otherwise must be a valid
// ObjectId string.
const assigneeField = z
    .union([z.string(), z.undefined()])
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || mongoose.isValidObjectId(v), {
        message: "Assignee must be a valid user",
    });

export const createTaskSchema = z.object({
    title: titleField,
    description: descriptionField,
    status: statusField.optional().default("todo"),
    priority: priorityField.optional().default("medium"),
    dueDate: dueDateField,
    assignee: assigneeField.optional(),
});

export const updateTaskSchema = z.object({
    title: titleField,
    description: descriptionField,
    status: statusField,
    priority: priorityField,
    dueDate: dueDateField,
    assignee: assigneeField.optional(),
});

// Just the status — used by the "quick move" buttons on the board view.
export const changeStatusSchema = z.object({
    status: statusField,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
