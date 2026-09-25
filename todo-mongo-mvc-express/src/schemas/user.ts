/* ---------------------------------------------------------------------------
 * src/schemas/user.ts
 *
 * Zod schemas for the three user-facing auth flows plus the profile-edit
 * form:
 *
 *   * signupSchema        — POST /signup
 *   * loginSchema         — POST /login
 *   * updateProfileSchema — PUT /users/:id (name + email; password change is
 *                          handled by `changePasswordSchema` separately so the
 *                          view can display the two flows independently)
 *   * changePasswordSchema
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { z } from "zod";

const nameField = z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(80, "Name cannot exceed 80 characters");

const emailField = z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .max(200, "Email is too long")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email format looks wrong");

// Keep the minimum short — this is a demo. Prod apps should require ≥ 12
// and check against a common-password list.
const passwordField = z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long");

export const signupSchema = z
    .object({
        name: nameField,
        email: emailField,
        password: passwordField,
        confirmPassword: z.string().optional(),
    })
    .refine(
        (data) => data.confirmPassword === undefined || data.confirmPassword === data.password,
        { path: ["confirmPassword"], message: "Passwords do not match" }
    );

export const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
    name: nameField,
    email: emailField,
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: passwordField,
        confirmNewPassword: z.string().optional(),
    })
    .refine(
        (d) => d.confirmNewPassword === undefined || d.confirmNewPassword === d.newPassword,
        { path: ["confirmNewPassword"], message: "Passwords do not match" }
    );

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
