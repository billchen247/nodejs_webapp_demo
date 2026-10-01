/* ---------------------------------------------------------------------------
 * src/models/tasks.ts
 *
 * The Mongoose model for project-management tasks.
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
 * format uses a string of hex instead of a positive integer.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// The public shape of a Task as it appears in JSON responses.
export interface TaskDTO {
    id: string;
    title: string;
    description: string;
    status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    completed: boolean;
    projectId?: string;
    assigneeId?: string;
    dueDate?: string;
    labels: string[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Field 'title' is required and must be a non-empty string"],
            trim: true,
            minlength: [1, "Field 'title' is required and must be a non-empty string"],
            maxlength: [200, "Field 'title' must be 200 characters or fewer"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, "Field 'description' must be 5000 characters or fewer"],
            default: "",
        },
        status: {
            type: String,
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            required: true,
            default: "todo",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            required: true,
            default: "medium",
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
        assigneeId: {
            type: Schema.Types.ObjectId,
            required: false,
            index: true,
        },
        dueDate: {
            type: Date,
            required: false,
        },
        labels: {
            type: [{ type: String, trim: true, minlength: 1, maxlength: 40 }],
            default: [],
            validate: {
                validator: (labels: string[]) => labels.length <= 20,
                message: "Field 'labels' must contain 20 or fewer labels",
            },
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
                if (ret["assigneeId"] != null) {
                    ret["assigneeId"] = String(ret["assigneeId"]);
                }
                return ret;
            },
        },
    }
);

// Index common task workflow and ownership filters.
taskSchema.index({ status: 1, priority: 1, createdAt: -1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });

// The raw (pre-hydration) shape of a Task document. Handy for tests and any
// consumer that wants to build a plain object matching the schema. Prefer
// `InferSchemaType` over declaring interfaces by hand — it stays in sync with
// the schema automatically.
export type TaskRaw = InferSchemaType<typeof taskSchema>;

// One canonical model, keyed off the "Task" name. `mongoose.models` guards
// against re-registering the model when the file is imported more than once,
// which happens with tsx watch mode and Vitest hot reloads.
export const TaskModel: Model<TaskRaw> =
    (mongoose.models["Task"] as Model<TaskRaw>) ??
    mongoose.model<TaskRaw>("Task", taskSchema);

// The hydrated document type Mongoose returns from queries.
export type TaskDoc = InstanceType<typeof TaskModel>;
