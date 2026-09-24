/* ---------------------------------------------------------------------------
 * src/schemas/projects.ts
 *
 * Zod schemas for the Project resource. Kept structurally identical to
 * schemas/todos.ts so the validate() middleware treats them uniformly.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";
import { OBJECT_ID_RE } from "./object-id.js";

export const ProjectIdParamSchema = z.object({
    id: z.string().regex(OBJECT_ID_RE, "Invalid Project ID"),
});

export const CreateProjectSchema = z.object({
    name: z
        .string({ required_error: "Field 'name' is required and must be a non-empty string" })
        .trim()
        .min(1, "Field 'name' is required and must be a non-empty string"),
});

export const UpdateProjectSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Field 'name' must be a non-empty string")
            .optional(),
    })
    .strip();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
