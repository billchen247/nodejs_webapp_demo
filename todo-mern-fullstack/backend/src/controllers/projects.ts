import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ProjectModel } from "../models/Project.js";

const createProjectSchema = z.object({
    name: z.string().trim().min(1, "Project name is required.").max(120),
    description: z.string().trim().max(1000).optional(),
});

const updateProjectSchema = z.object({
    name: z.string().trim().min(1, "Project name is required.").max(120).optional(),
    description: z.string().trim().max(1000).optional(),
}).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: "Provide at least one field to update." },
);

const idParamSchema = z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id."),
});

export async function listProjects(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const projects = await ProjectModel.find().sort({ createdAt: -1 }).exec();
        res.json(projects);
    } catch (err) {
        next(err);
    }
}

export async function getProject(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = idParamSchema.parse(req.params);
        const project = await ProjectModel.findById(id).exec();
        if (!project) {
            res.status(404).json({ error: "Project not found." });
            return;
        }
        res.json(project);
    } catch (err) {
        next(err);
    }
}

export async function createProject(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const input = createProjectSchema.parse(req.body);
        const created = await ProjectModel.create(input);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
}

export async function updateProject(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = idParamSchema.parse(req.params);
        const patch = updateProjectSchema.parse(req.body);
        const updated = await ProjectModel.findByIdAndUpdate(id, patch, {
            new: true,
            runValidators: true,
        }).exec();

        if (!updated) {
            res.status(404).json({ error: "Project not found." });
            return;
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function deleteProject(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = idParamSchema.parse(req.params);
        const result = await ProjectModel.findByIdAndDelete(id).exec();
        if (!result) {
            res.status(404).json({ error: "Project not found." });
            return;
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
