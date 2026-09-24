/* ---------------------------------------------------------------------------
 * src/controllers/projects.ts
 *
 * Handlers for the /api/projects resource. Same shape as controllers/todos.ts:
 * inputs are already Zod-validated by the route middleware, the model does
 * the persistence, and HttpError instances are thrown for the sad paths.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { ProjectModel } from "../models/projects.js";
import { TodoModel } from "../models/todos.js";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/projects.js";
import { notFound } from "../utils/http-error.js";

// GET /api/projects
export const listProjects: RequestHandler = async (_req, res) => {
    const projects = await ProjectModel.find({}).sort({ createdAt: 1, _id: 1 }).exec();
    res.json(projects);
};

// GET /api/projects/:id
export const getProjectById: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const project = await ProjectModel.findById(id);
    if (!project) throw notFound("Project not found");
    res.json(project);
};

// GET /api/projects/:id/tasks — list tasks belonging to a project.
// 404 first if the project doesn't exist, so an empty array is meaningful.
export const listProjectTasks: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const project = await ProjectModel.findById(id);
    if (!project) throw notFound("Project not found");

    const tasks = await TodoModel.find({ projectId: id }).sort({ createdAt: 1, _id: 1 });
    res.json(tasks);
};

// POST /api/projects/:id/tasks — create a task nested under the project.
// Body: { title: string } — the path id overrides any projectId in the body.
export const createProjectTask: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const body = req.body as { title: string };

    const project = await ProjectModel.findById(id);
    if (!project) throw notFound("Project not found");

    const task = await TodoModel.create({ title: body.title, projectId: id });
    res.status(201).json(task);
};

// POST /api/projects
// Body: { name: string }
export const createProject: RequestHandler = async (req, res) => {
    const body = req.body as CreateProjectInput;
    const project = await ProjectModel.create({ name: body.name });
    res.status(201).json(project);
};

// DELETE /api/projects/:id — 204 on success.
// Cascade: any tasks with projectId === id are removed too. This keeps the
// data consistent when a project goes away.
export const deleteProject: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const result = await ProjectModel.findByIdAndDelete(id);
    if (!result) throw notFound("Project not found");

    await TodoModel.deleteMany({ projectId: id });
    res.status(204).end();
};

// PUT /api/projects/:id
// Body: { name?: string } — missing fields are left unchanged.
export const updateProject: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateProjectInput;

    const project = await ProjectModel.findById(id).exec();
    if (!project) throw notFound("Project not found");

    if (body.name !== undefined) project.name = body.name;

    await project.save();
    res.json(project);
};
