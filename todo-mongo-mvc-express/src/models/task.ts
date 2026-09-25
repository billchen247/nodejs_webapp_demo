/* ---------------------------------------------------------------------------
 * src/models/task.ts
 *
 * A TASK is the atomic unit of work in the task manager. Compared to the
 * legacy `Todo` model, a Task carries richer state:
 *
 *   * `status`     — one of "todo" | "in_progress" | "done"
 *   * `priority`   — one of "low" | "medium" | "high"
 *   * `dueDate`    — optional Date; nullable in views
 *   * `project`    — required ref to a Project (tasks live inside projects)
 *   * `assignee`   — optional ref to a User (who should do it)
 *   * `createdBy`  — required ref to a User (audit trail)
 *
 * The status/priority values are exported as tuples so views and Zod schemas
 * both agree on the allowed strings — one source of truth.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// Human-readable labels for the status/priority pills in views.
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
    todo: "To do",
    in_progress: "In progress",
    done: "Done",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

export interface TaskView {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    project: string;         // Project id
    projectName?: string;    // populated
    assignee: string | null; // User id or null
    assigneeName?: string;   // populated
    createdBy: string;       // User id
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [1, "Title cannot be empty"],
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [4000, "Description cannot exceed 4000 characters"],
            default: "",
        },
        status: {
            type: String,
            enum: {
                values: TASK_STATUSES as unknown as string[],
                message: "Status must be one of: todo, in_progress, done",
            },
            required: true,
            default: "todo",
        },
        priority: {
            type: String,
            enum: {
                values: TASK_PRIORITIES as unknown as string[],
                message: "Priority must be one of: low, medium, high",
            },
            required: true,
            default: "medium",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: [true, "Project is required"],
            index: true,
        },
        assignee: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
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

// Sorted lists of a project's board are extremely common (project detail
// page). Index the two columns we sort/filter on together.
taskSchema.index({ project: 1, status: 1, createdAt: -1 });

export type TaskRaw = InferSchemaType<typeof taskSchema>;

export const TaskModel: Model<TaskRaw> =
    (mongoose.models["Task"] as Model<TaskRaw>) ??
    mongoose.model<TaskRaw>("Task", taskSchema);

export type TaskDoc = InstanceType<typeof TaskModel>;
