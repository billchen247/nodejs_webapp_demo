/* ---------------------------------------------------------------------------
 * src/models/projects.ts
 *
 * Mongoose model for the Project resource — the parent of a Todo/Task in the
 * task-manager slice. Mirrors the shape of models/todos.ts so the toJSON
 * transform, timestamps, and model-registration guard behave identically.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export interface ProjectDTO {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Field 'name' is required and must be a non-empty string"],
            trim: true,
            minlength: [1, "Field 'name' is required and must be a non-empty string"],
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
    }
);

export type ProjectRaw = InferSchemaType<typeof projectSchema>;

export const ProjectModel: Model<ProjectRaw> =
    (mongoose.models["Project"] as Model<ProjectRaw>) ??
    mongoose.model<ProjectRaw>("Project", projectSchema);

export type ProjectDoc = InstanceType<typeof ProjectModel>;
