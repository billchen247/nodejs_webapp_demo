/* ---------------------------------------------------------------------------
 * src/schemas/todos.ts
 *
 * Zod schemas for validating incoming requests. In the sister projects
 * validation lives inline in the controllers (`typeof body.title === "string"`
 * etc). Here we lean on Zod so we get:
 *
 *   - one schema definition that produces both a runtime validator AND a
 *     TypeScript type (via `z.infer`), guaranteed to stay in sync,
 *   - clear error messages the controller can surface as a 400,
 *   - trivial extension: adding a new field is one Zod line.
 *
 * Zod is one of the standard modern choices for Express validation (others
 * are Joi and yup). We picked Zod because it plays especially well with
 * TypeScript — `z.infer<typeof S>` gives you the type "for free" without a
 * second declaration.
 * -------------------------------------------------------------------------*/

import { z } from "zod";

/* -------- path params ---------------------------------------------------- */

// /api/todos/:id — `id` arrives as a string; coerce it to a positive integer.
// Rejects "abc", "1.5", "-3", " 4 ", etc.
export const TodoIdParamSchema = z.object({
    id: z
        .string()
        .regex(/^\d+$/, "Invalid Todo ID")
        .transform((s) => Number(s))
        .refine((n) => Number.isInteger(n) && n > 0, "Invalid Todo ID"),
});

/* -------- query params --------------------------------------------------- */

// GET /api/todos?completed=true|false — the filter is optional. If present, it
// must be the literal string "true" or "false".
export const TodoListQuerySchema = z.object({
    completed: z.enum(["true", "false"]).optional(),
});

/* -------- request bodies ------------------------------------------------- */

// POST /api/todos — only `title` is accepted from the client; the server owns
// id, completed, and createdAt.
export const CreateTodoSchema = z.object({
    title: z
        .string({ required_error: "Field 'title' is required and must be a non-empty string" })
        .trim()
        .min(1, "Field 'title' is required and must be a non-empty string"),
});

// PUT /api/todos/:id — both fields are optional; missing fields leave the
// stored value untouched. Unknown fields are stripped so a client can't
// invent an `id` or `createdAt`.
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
