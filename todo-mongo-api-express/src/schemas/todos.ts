/* ---------------------------------------------------------------------------
 * src/schemas/todos.ts
 *
 * Zod schemas for validating incoming requests. Same idea as in
 * ../../todo-node-api-express, with two changes worth calling out:
 *
 *   * `id` is now a 24-character hex string (a MongoDB ObjectId) instead of a
 *     positive integer.
 *   * The list endpoint also accepts `?limit` and `?skip` for pagination.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";

/* -------- path params ---------------------------------------------------- */

// /api/todos/:id — MongoDB ObjectIds are 24 lowercase hex chars.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export const TodoIdParamSchema = z.object({
    id: z.string().regex(OBJECT_ID_RE, "Invalid Todo ID"),
});

/* -------- query params --------------------------------------------------- */

// GET /api/todos?completed=true|false&limit=N&skip=N
export const TodoListQuerySchema = z.object({
    completed: z.enum(["true", "false"]).optional(),
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

// POST /api/todos — only `title` is accepted from the client. The server owns
// id, completed, createdAt, updatedAt.
export const CreateTodoSchema = z.object({
    title: z
        .string({ required_error: "Field 'title' is required and must be a non-empty string" })
        .trim()
        .min(1, "Field 'title' is required and must be a non-empty string"),
});

// PUT /api/todos/:id — both fields optional; missing fields leave the stored
// value untouched. Unknown fields are stripped so a client can't invent an
// `id`, `createdAt`, etc.
export const UpdateTodoSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, "Field 'title' must be a non-empty string")
            .optional(),
        completed: z
            .boolean({ invalid_type_error: "Field 'completed' must be a boolean" })
            .optional(),
    })
    .strip();

/* -------- inferred TS types ---------------------------------------------- */

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export type TodoListQuery = z.infer<typeof TodoListQuerySchema>;
