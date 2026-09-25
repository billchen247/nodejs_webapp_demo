import { z } from "zod";

export const ProjectIdParamSchema = z.object({
    id: z
        .string()
        .regex(/^\d+$/, "Invalid Project ID")
        .transform((value) => Number(value))
        .refine((value) => Number.isInteger(value) && value > 0, "Invalid Project ID"),
});

export const CreateProjectSchema = z.object({
    name: z
        .string({ required_error: "Field 'name' is required and must be a non-empty string" })
        .trim()
        .min(1, "Field 'name' is required and must be a non-empty string"),
    description: z.string().trim().optional().default(""),
});

export const UpdateProjectSchema = z
    .object({
        name: z.string().trim().min(1, "Field 'name' must be a non-empty string").optional(),
        description: z.string().trim().optional(),
    })
    .strip();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;