import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const projectSchema = new Schema(
    {
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "A project must have a name."],
            trim: true,
            minlength: 1,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform(_doc, ret: Record<string, unknown>) {
                ret.id = String(ret._id);
                delete ret._id;
            },
        },
    },
);

export type Project = InferSchemaType<typeof projectSchema>;
export type ProjectDoc = HydratedDocument<Project>;

export const ProjectModel = model<Project>("Project", projectSchema);
