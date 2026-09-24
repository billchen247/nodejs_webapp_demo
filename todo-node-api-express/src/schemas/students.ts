import { z } from "zod";

export const StudentIdParamSchema = z.object({
    id: z
        .string()
        .regex(/^\d+$/, "Invalid Student ID")
        .transform((value) => Number(value))
        .refine((value) => Number.isInteger(value) && value > 0, "Invalid Student ID"),
});

export const StudentListQuerySchema = z.object({
    registrationActive: z.enum(["true", "false"]).optional(),
});

export const CreateStudentSchema = z.object({
    name: z
        .string({ required_error: "Field 'name' is required and must be a non-empty string" })
        .trim()
        .min(1, "Field 'name' is required and must be a non-empty string"),
});

export const UpdateStudentSchema = z
    .object({
        name: z.string().trim().min(1, "Field 'name' must be a non-empty string").optional(),
        registrationActive: z
            .boolean({ invalid_type_error: "Field 'registrationActive' must be a boolean" })
            .optional(),
    })
    .strip();

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;