/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/models/Task.ts
 *
 * The Task model, now **owned** by a specific user.
 *
 * New in Week 7:
 *   - `userId` field. Required, references the User model.
 *   - A compound index on `(userId, createdAt desc)` so the common
 *     "list my tasks, newest first" query can hit an index.
 *
 * The toJSON transform intentionally hides `userId` from the response.
 * The client already knows whose tasks these are — they are the only
 * tasks it ever sees — and leaking the raw ObjectId is a mild info
 * disclosure we can avoid cheaply.
 */
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // We query `Task.find({ userId })` constantly. An index here turns
      // that from a collection scan into an index seek.
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string } | undefined)?.toString?.() ?? ret.id;
        delete ret._id;
        // Hide ownership from the response body.
        delete ret.userId;
        return ret;
      },
    },
  },
);

// Compound index for the dominant query pattern: a user's tasks, newest first.
taskSchema.index({ userId: 1, createdAt: -1 });

export type TaskAttrs = InferSchemaType<typeof taskSchema>;
export type TaskDocument = HydratedDocument<TaskAttrs>;

export const Task = model("Task", taskSchema);
