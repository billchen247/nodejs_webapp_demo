/* ---------------------------------------------------------------------------
 * src/schemas/tasks.ts
 *
 * Zod schemas for validating incoming requests. Same idea as in
 * ../../task-node-api-express, with two changes worth calling out:
 *
 *   * `id` is now a 24-character hex string (a MongoDB ObjectId) instead of a
 *     positive integer.
 *   * The list endpoint also accepts `?limit` and `?skip` for pagination.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";
import { OBJECT_ID_RE } from "./object-id.js";

export const TaskIdParamSchema = z.object({
    id: z.string().regex(OBJECT_ID_RE, "Invalid Task ID"),
});

/* -------- query params --------------------------------------------------- */

export const TASK_STATUSES = [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "done",
] as const;

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

// GET /api/tasks?status=todo&priority=high&projectId=...&assigneeId=...
export const TaskListQuerySchema = z.object({
    completed: z.enum(["true", "false"]).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    projectId: z
        .string()
        .regex(OBJECT_ID_RE, "Field 'projectId' must be a 24-char hex string")
        .optional(),
    assigneeId: z
        .string()
        .regex(OBJECT_ID_RE, "Field 'assigneeId' must be a 24-char hex string")
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, "limit must be a non-negative integer")
        .transform((s) => Number(s))
        .refine((n) => n >= 1 && n <= 200, "limit must be between 1 and 200")
        .optional(),
    skip: z
        .string()
        .regex(/^\d+$/, "skip must be a non-negative integer")
        .transform((s) => Number(s))
        .optional(),
});

/* -------- request bodies ------------------------------------------------- */

const taskFields = {
    title: z
        .string({ required_error: "Field 'title' is required and must be a non-empty string" })
        .trim()
        .min(1, "Field 'title' is required and must be a non-empty string")
        .max(200, "Field 'title' must be 200 characters or fewer"),
    description: z
        .string()
        .trim()
        .max(5000, "Field 'description' must be 5000 characters or fewer"),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    projectId: z
        .string()
        .regex(OBJECT_ID_RE, "Field 'projectId' must be a 24-char hex string"),
    assigneeId: z
        .string()
        .regex(OBJECT_ID_RE, "Field 'assigneeId' must be a 24-char hex string"),
    dueDate: z.string().datetime().transform((value) => new Date(value)),
    labels: z
        .array(z.string().trim().min(1).max(40))
        .max(20, "Field 'labels' must contain 20 or fewer labels"),
};

// The server owns id, timestamps, and the derived `completed` compatibility
// field. Nullable optional fields can be cleared on update.
export const CreateTaskSchema = z.object({
    title: taskFields.title,
    description: taskFields.description.optional().default(""),
    status: taskFields.status.optional().default("todo"),
    priority: taskFields.priority.optional().default("medium"),
    projectId: taskFields.projectId.optional(),
    assigneeId: taskFields.assigneeId.optional(),
    dueDate: taskFields.dueDate.optional(),
    labels: taskFields.labels.optional().default([]),
}).strip();

// PUT /api/tasks/:id — omitted fields remain unchanged; nullable values clear
// optional assignments/dates. Unknown fields cannot overwrite server fields.
export const UpdateTaskSchema = z
    .object({
        title: taskFields.title.optional(),
        description: taskFields.description.optional(),
        status: taskFields.status.optional(),
        priority: taskFields.priority.optional(),
        completed: z
            .boolean({ invalid_type_error: "Field 'completed' must be a boolean" })
            .optional(),
        projectId: taskFields.projectId.nullable().optional(),
        assigneeId: taskFields.assigneeId.nullable().optional(),
        dueDate: taskFields.dueDate.nullable().optional(),
        labels: taskFields.labels.optional(),
    })
    .strip();

/* -------- inferred TS types ---------------------------------------------- */

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>;
