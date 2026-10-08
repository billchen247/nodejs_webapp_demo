import type { InferSchemaType } from "mongoose";

import { model, Schema } from "mongoose";

const projectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
    unique: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
    maxlength: 2000,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export type Project = InferSchemaType<typeof projectSchema>;

const ProjectModel = model<Project>("Project", projectSchema);

export default ProjectModel;
