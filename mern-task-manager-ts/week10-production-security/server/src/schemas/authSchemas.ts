/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/schemas/authSchemas.ts
 *
 * Zod schemas for the auth endpoints. These act as both the validator
 * and the TypeScript type source — see `type RegisterBody = ...`
 * below. Change the schema and the type updates everywhere it is used.
 */
import { z } from "zod";

/** Normalize email at the schema boundary — trim + lowercase.
 *  By the time a controller sees it, no further munging is required. */
const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Email looks invalid")
  .transform((v) => v.toLowerCase());

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    name: z.string().trim().max(100).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailField,
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailField,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Reset token is missing"),
    newPassword: passwordField,
  })
  .strict();

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
