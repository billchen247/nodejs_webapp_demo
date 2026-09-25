/* ---------------------------------------------------------------------------
 * src/models/project.ts
 *
 * A PROJECT owns a bag of Tasks. Every project has exactly one `owner` (a
 * User). Anyone signed in can browse projects, but only the owner can edit,
 * rename, or delete their own project.
 *
 * The `owner` field is a Mongoose ObjectId ref to `User`. Controllers use
 * `.populate("owner")` when they need the owner's name for a header.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export interface ProjectView {
    id: string;
    name: string;
    description: string;
    owner: string;          // User id
    ownerName?: string;     // populated (optional — only when we asked for it)
    taskCount?: number;     // computed by list controller
    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            minlength: [1, "Project name cannot be empty"],
            maxlength: [120, "Project name cannot exceed 120 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
            default: "",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Owner is required"],
            index: true,
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

// Case-insensitive uniqueness of (owner, name) so one user can't have two
// projects called "Website Redesign". Two different users can share the name.
projectSchema.index(
    { owner: 1, name: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } }
);

export type ProjectRaw = InferSchemaType<typeof projectSchema>;

// The raw doc's `owner` is a Types.ObjectId; when populated it becomes the
// full User doc. Consumers narrow as needed.
export type ProjectOwnerRef = Types.ObjectId;

export const ProjectModel: Model<ProjectRaw> =
    (mongoose.models["Project"] as Model<ProjectRaw>) ??
    mongoose.model<ProjectRaw>("Project", projectSchema);

export type ProjectDoc = InstanceType<typeof ProjectModel>;
