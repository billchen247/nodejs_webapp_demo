/* ---------------------------------------------------------------------------
 * src/schemas/todo.ts
 *
 * Zod schemas for form input. In an MVC app the "request body" comes from
 * HTML forms, so it's always `application/x-www-form-urlencoded`:
 *
 *   * `title` arrives as a plain string.
 *   * `completed` arrives as the string "on" (checked) or is absent (unchecked).
 *
 * Zod's `.transform()` and `.preprocess()` normalise those quirks so the
 * controllers can work with real booleans and trimmed strings.
 *
 * Why schemas AS WELL AS Mongoose validators?
 *   * Zod runs first and rejects malformed input with a friendly form-level
 *     message BEFORE Mongoose sees the payload. Cleaner error UX.
 *   * The inferred TypeScript types (`z.infer<typeof schema>`) keep the
 *     controller signatures honest.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";

// HTML checkboxes submit the string "on" when checked and omit the field
// entirely when unchecked. Normalise both to a real boolean.
const checkboxToBool = z
    .union([z.literal("on"), z.literal("true"), z.boolean(), z.undefined()])
    .transform((v) => v === true || v === "on" || v === "true");

export const createTodoSchema = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title cannot exceed 200 characters"),
    completed: checkboxToBool.optional(),
});

export const updateTodoSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title cannot exceed 200 characters")
        .optional(),
    completed: checkboxToBool.optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
