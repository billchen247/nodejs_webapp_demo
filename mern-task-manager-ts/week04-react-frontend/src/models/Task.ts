/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 03
 * File: src/models/Task.ts
 *
 * The Task model.
 *
 * Three layers to understand:
 *
 *   TypeScript interface  →  Mongoose schema  →  MongoDB document
 *       (compile time)         (runtime rules)      (what's on disk)
 *
 *   - The interface is for the compiler and for other TypeScript code.
 *   - The schema is what Mongoose uses to validate, cast, and query.
 *   - The document is the plain object that lives in MongoDB.
 *
 * All three describe the same shape; they just live at different stages.
 */
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

/**
 * The schema definition. This is the source of truth; the TypeScript type
 * is derived from it below with `InferSchemaType`, so the two cannot drift.
 */
const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title must be 200 characters or fewer"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description must be 2000 characters or fewer"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically maintain `createdAt` and `updatedAt` on every document.
    timestamps: true,
    // When we JSON-serialise a task, strip the Mongo-specific `__v` field
    // and rename `_id` to `id` so the API feels friendly to a React client.
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string } | undefined)?.toString?.() ?? ret.id;
        delete ret._id;
        return ret;
      },
    },
  },
);

/**
 * `InferSchemaType` reads the schema above and produces a matching TS type.
 * This is better than hand-writing an interface because it cannot drift
 * from the schema — add a field to the schema, the type picks it up.
 */
export type TaskAttrs = InferSchemaType<typeof taskSchema>;

/** A fully hydrated task document (has `.save()`, `.id`, etc.). */
export type TaskDocument = HydratedDocument<TaskAttrs>;

export const Task = model("Task", taskSchema);
