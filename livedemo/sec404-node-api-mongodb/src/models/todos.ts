/* ---------------------------------------------------------------------------
 * src/models/todos.ts
 *
 * The Mongoose model. This is where a real database replaces the JSON-file
 * "database" the four sister projects used:
 *
 *   ../todo-node-api/src/models/todos.js        raw http     + fs
 *   ../todo-connect-api/src/models/todos.js     Connect      + fs
 *   ../todo-express-api/src/models/todos.js     Express 4    + fs
 *   ../todo-node-api-express/src/models/todos.ts Express 5   + fs
 *   this file                                    Express 5    + MongoDB
 *
 * A Mongoose schema does three jobs at once:
 *   1. Declares the shape of a document in the collection.
 *   2. Adds validation rules (`required`, `trim`, `minlength`, ...).
 *   3. Defines a `Model` that exposes typed CRUD helpers (`find`, `create`, ...).
 *
 * The `id` story
 * --------------
 * MongoDB documents are keyed by an `_id` field — a 12-byte ObjectId, rendered
 * as a 24-character hex string in JSON. We DON'T expose Mongo's internal
 * fields directly: the schema's `toJSON` transform below strips `_id`,
 * `__v`, and copies `_id` into a friendly `id` string. This keeps the wire
 * format identical to the sibling projects apart from the id being a string
 * of hex instead of a positive integer.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// The public shape of a Todo as it appears in JSON responses.
export interface TodoDTO {
    id: string;
    title: string;
    completed: boolean;
    projectId?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

const todoSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Field 'title' is required and must be a non-empty string"],
            trim: true,
            minlength: [1, "Field 'title' is required and must be a non-empty string"],
        },
        completed: {
            type: Boolean,
            required: true,
            default: false,
        },
        // Optional parent project. Kept as a plain ObjectId (not a `ref:`) so
        // the wire format stays a hex string, matching the rest of the API.
        projectId: {
            type: Schema.Types.ObjectId,
            required: false,
            index: true,
        },
    },
    {
        // Mongoose adds `createdAt` and `updatedAt` for us and keeps them
        // fresh on every save/update.
        timestamps: true,
        // Convert `_id` to `id` and drop Mongo internals when serialising to
        // JSON so the API surface doesn't leak the database's private fields.
        toJSON: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = String(ret["_id"]);
                delete ret["_id"];
                // Render projectId as a string too — Mongoose stores it as
                // an ObjectId, which JSON-serialises to an object otherwise.
                if (ret["projectId"] != null) {
                    ret["projectId"] = String(ret["projectId"]);
                }
                return ret;
            },
        },
    }
);

// Compound index example: filter-by-completed queries hit an index instead of
// a full collection scan. Handy when the collection grows.
todoSchema.index({ completed: 1, createdAt: -1 });

// The raw (pre-hydration) shape of a Todo document. Handy for tests and any
// consumer that wants to build a plain object matching the schema. Prefer
// `InferSchemaType` over declaring interfaces by hand — it stays in sync with
// the schema automatically.
export type TodoRaw = InferSchemaType<typeof todoSchema>;

// One canonical model, keyed off the "Todo" name. `mongoose.models` guards
// against re-registering the model when the file is imported more than once,
// which happens with tsx watch mode and Vitest hot reloads.
export const TodoModel: Model<TodoRaw> =
    (mongoose.models["Todo"] as Model<TodoRaw>) ??
    mongoose.model<TodoRaw>("Todo", todoSchema);

// The hydrated document type Mongoose returns from queries.
export type TodoDoc = InstanceType<typeof TodoModel>;
