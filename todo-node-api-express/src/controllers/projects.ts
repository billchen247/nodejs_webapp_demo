import type { RequestHandler } from "express";
import { readProjects, writeProjects, type Project } from "../models/projects.js";
import {
    type CreateProjectInput,
    type UpdateProjectInput,
} from "../schemas/projects.js";
import { notFound } from "../utils/http-error.js";

export const listProjects: RequestHandler = async (_req, res) => {
    res.json(await readProjects());
};

export const getProjectById: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const projects = await readProjects();
    const project = projects.find((item) => item.id === id);
    if (!project) throw notFound("Project not found");
    res.json(project);
};

export const createProject: RequestHandler = async (req, res) => {
    const body = req.body as CreateProjectInput;
    const projects = await readProjects();
    const nextId =
        projects.length === 0 ? 1 : Math.max(...projects.map((project) => project.id)) + 1;

    const project: Project = {
        id: nextId,
        name: body.name,
        description: body.description,
        createdAt: new Date().toISOString(),
    };

    projects.push(project);
    await writeProjects(projects);
    res.status(201).json(project);
};

export const updateProject: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const body = req.body as UpdateProjectInput;
    const projects = await readProjects();
    const index = projects.findIndex((project) => project.id === id);
    if (index === -1) throw notFound("Project not found");

    const existing = projects[index] as Project;
    if (body.name !== undefined) existing.name = body.name;
    if (body.description !== undefined) existing.description = body.description;

    await writeProjects(projects);
    res.json(existing);
};

export const deleteProject: RequestHandler = async (req, res) => {
    const id = (req.params as unknown as { id: number }).id;
    const projects = await readProjects();
    const index = projects.findIndex((project) => project.id === id);
    if (index === -1) throw notFound("Project not found");

    projects.splice(index, 1);
    await writeProjects(projects);
    res.status(204).end();
};