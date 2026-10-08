import type { Request, Response } from "express";

import mongoose from "mongoose";
import { z } from "zod/v4";

import Project from "../models/project.js";

type ProjectIdParams = { id: string };

const projectNameSchema = z.string().trim().min(1).max(200);
const projectDescriptionSchema = z.string().trim().max(2000);

const projectInputSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema.default(""),
}).strict();

const projectPatchSchema = z.object({
  name: projectNameSchema.optional(),
  description: projectDescriptionSchema.optional(),
}).strict().refine(project => Object.keys(project).length > 0, "At least one field must be provided");

function isValidProjectId(id: string): boolean {
  return mongoose.isObjectIdOrHexString(id);
}

export async function listProjects(_req: Request, res: Response): Promise<void> {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json(projects);
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const result = projectInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid project", issues: result.error.issues });
    return;
  }

  const project = await Project.create(result.data);
  res.location(`/api/v1/projects/${project.id}`).status(201).json(project);
}

export async function getProject(req: Request<ProjectIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidProjectId(id)) {
    res.status(400).json({ message: "Invalid project id" });
    return;
  }

  const project = await Project.findById(id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.json(project);
}

export async function replaceProject(req: Request<ProjectIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidProjectId(id)) {
    res.status(400).json({ message: "Invalid project id" });
    return;
  }

  const result = projectInputSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid project", issues: result.error.issues });
    return;
  }

  const project = await Project.findByIdAndUpdate(id, result.data, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.json(project);
}

export async function updateProject(req: Request<ProjectIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidProjectId(id)) {
    res.status(400).json({ message: "Invalid project id" });
    return;
  }

  const result = projectPatchSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Invalid project", issues: result.error.issues });
    return;
  }

  const project = await Project.findByIdAndUpdate(id, { $set: result.data }, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.json(project);
}

export async function deleteProject(req: Request<ProjectIdParams>, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidProjectId(id)) {
    res.status(400).json({ message: "Invalid project id" });
    return;
  }

  const project = await Project.findByIdAndDelete(id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  res.status(204).end();
}
