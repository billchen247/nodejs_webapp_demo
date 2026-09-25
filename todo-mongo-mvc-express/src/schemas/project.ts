/* ---------------------------------------------------------------------------
 * src/schemas/project.ts
 *
 * Zod schemas for the project create/edit form.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";

const nameField = z
    .string({ required_error: "Project name is required" })
    .trim()
    .min(1, "Project name cannot be empty")
    .max(120, "Project name cannot exceed 120 characters");

const descriptionField = z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    // Normalise "" → "" so the controller doesn't see undefined+"" as two states.
    .transform((v) => v ?? "");

export const createProjectSchema = z.object({
    name: nameField,
    description: descriptionField,
});

export const updateProjectSchema = z.object({
    name: nameField,
    description: descriptionField,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
