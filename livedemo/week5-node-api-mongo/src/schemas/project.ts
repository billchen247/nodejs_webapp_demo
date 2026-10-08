import mongoose from "mongoose";
import { z } from "zod/v4";

const projectNameSchema = z.string().trim().min(1).max(200);
const projectWriteNameSchema = projectNameSchema.refine(
  name => /[a-z]/i.test(name),
  "Project name must contain at least one letter",
);
const projectDescriptionSchema = z.string().trim().max(2000);

export const projectQuerySchema = z.object({
  name: projectNameSchema.optional(),
}).strict();

export const projectInputSchema = z.object({
  name: projectWriteNameSchema,
  description: projectDescriptionSchema.default(""),
}).strict();

export const projectPatchSchema = z.object({
  name: projectWriteNameSchema.optional(),
  description: projectDescriptionSchema.optional(),
}).strict().refine(project => Object.keys(project).length > 0, "At least one field must be provided");

export function isValidProjectId(id: string): boolean {
  return mongoose.isObjectIdOrHexString(id);
}
