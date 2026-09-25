/* ---------------------------------------------------------------------------
 * src/models/todo.ts
 *
 * The MODEL in MVC — a Mongoose schema that owns:
 *   1. The shape of a Todo document.
 *   2. Server-side validation (`required`, `trim`, `minlength`).
 *   3. A typed `Model` with CRUD helpers.
 *
 * The controllers never touch `mongoose` directly. They import `TodoModel`
 * and use `find`, `findById`, `create`, `findByIdAndUpdate`, and
 * `findByIdAndDelete` — that boundary is what makes swapping the database
 * layer straightforward.
 *
 * The `id` story
 * --------------
 * MongoDB documents are keyed by `_id`, a 12-byte ObjectId rendered as a
 * 24-char hex string. We never expose Mongo's internal fields to views:
 * the `toJSON` transform below converts `_id` to `id` and drops `__v` so
 * templates can render `todo.id` naturally.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// The public shape of a Todo as it appears in views.
export interface TodoView {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const todoSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [1, "Title cannot be empty"],
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        completed: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        // Mongoose adds `createdAt` and `updatedAt` for us and keeps them
        // fresh on every save/update.
        timestamps: true,
        // Convert `_id` to `id` and drop Mongo internals when serialising to
        // JSON / plain objects for views.
        toJSON: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = String(ret["_id"]);
                delete ret["_id"];
                return ret;
            },
        },
        toObject: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = String(ret["_id"]);
                delete ret["_id"];
                return ret;
            },
        },
    }
);

// Compound index: sorting by newest-first with a completed filter hits an
// index instead of a full collection scan.
todoSchema.index({ completed: 1, createdAt: -1 });

export type TodoRaw = InferSchemaType<typeof todoSchema>;

// One canonical model, keyed off the "Todo" name. `mongoose.models` guards
// against re-registering when the file is imported more than once (tsx watch,
// Vitest hot reload).
export const TodoModel: Model<TodoRaw> =
    (mongoose.models["Todo"] as Model<TodoRaw>) ??
    mongoose.model<TodoRaw>("Todo", todoSchema);

export type TodoDoc = InstanceType<typeof TodoModel>;
