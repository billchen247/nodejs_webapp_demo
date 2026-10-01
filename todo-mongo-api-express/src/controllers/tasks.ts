/* ---------------------------------------------------------------------------
 * src/controllers/tasks.ts
 *
 * The "controller" layer for the /api/tasks resource. Each exported handler
 * is a small async Express handler that:
 *
 *   1. Reads already-validated data off req.body / req.params / req.query
 *      (the `validate` middleware in src/middleware/validate.ts has run).
 *   2. Calls the Mongoose model to read or write documents.
 *   3. Replies with `res.status(x).json(...)`, or throws an HttpError.
 *
 * Compared to the JSON-file sister project
 * ---------------------------------------
 *   - We no longer read the whole collection into memory to answer a query.
 *     Mongo does the filtering, indexing, and sorting server-side.
 *   - We no longer own the `id` counter — Mongo assigns ObjectIds.
 *   - We rely on the schema's `toJSON` transform (see models/tasks.ts) to
 *     serialize ObjectIds and hide MongoDB's internal fields.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { TaskModel } from "../models/tasks.js";
import { ProjectModel } from "../models/projects.js";
import type {
    CreateTaskInput,
    UpdateTaskInput,
    TaskListQuery,
} from "../schemas/tasks.js";
import { notFound } from "../utils/http-error.js";

// GET /api/tasks
// GET /api/tasks?status=todo&priority=high&projectId=...&assigneeId=...
export const listTasks: RequestHandler = async (req, res) => {
    const query = req.query as unknown as TaskListQuery;

    const filter: Record<string, unknown> = {};
    if (query.status !== undefined) filter["status"] = query.status;
    if (query.priority !== undefined) filter["priority"] = query.priority;
    if (query.projectId !== undefined) filter["projectId"] = query.projectId;
    if (query.assigneeId !== undefined) filter["assigneeId"] = query.assigneeId;
    if (query.completed === "true") filter["completed"] = true;
    else if (query.completed === "false") filter["completed"] = false;

    let cursor = TaskModel.find(filter).sort({ createdAt: 1, _id: 1 });
    if (typeof query.skip === "number") cursor = cursor.skip(query.skip);
    if (typeof query.limit === "number") cursor = cursor.limit(query.limit);

    const tasks = await cursor.exec();
    res.json(tasks);
};

// GET /api/tasks/:id
export const getTaskById: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };

    const task = await TaskModel.findById(id).exec();
    if (!task) throw notFound("Task not found");

    res.json(task);
};

// POST /api/tasks
// The server owns id, timestamps, and the compatibility `completed` flag.
export const createTask: RequestHandler = async (req, res) => {
    const body = req.body as CreateTaskInput;

    // If a projectId was supplied, verify the parent exists — otherwise the
    // client would be able to create orphaned tasks.
    if (body.projectId !== undefined) {
        const parent = await ProjectModel.findById(body.projectId);
        if (!parent) throw notFound("Project not found");
    }

    // `create` runs schema validation, so an all-whitespace title (already
    // trimmed by Zod) or a missing field still surfaces as a 400 via the
    // ValidationError branch in middleware/errors.ts.
    const task = await TaskModel.create({
        ...body,
        completed: body.status === "done",
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId } : {}),
    });

    // 201 Created is the correct status for "a new resource was made".
    res.status(201).json(task);
};

// PUT /api/tasks/:id
// `completed` remains supported for existing clients and maps to task status.
export const updateTask: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateTaskInput;

    // Two-step so we get a real 404 for a missing document AND schema-level
    // validation (e.g. `title: ""`) runs on the individual fields.
    const task = await TaskModel.findById(id).exec();
    if (!task) throw notFound("Task not found");

    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.labels !== undefined) task.labels = body.labels;
    if (body.projectId !== undefined) {
        if (body.projectId === null) {
            task.projectId = undefined;
        } else {
            const parent = await ProjectModel.findById(body.projectId);
            if (!parent) throw notFound("Project not found");
            task.projectId = parent._id;
        }
    }
    if (body.assigneeId !== undefined) {
        task.assigneeId =
            body.assigneeId === null ? undefined : new Types.ObjectId(body.assigneeId);
    }
    if (body.dueDate !== undefined) task.dueDate = body.dueDate ?? undefined;

    if (body.status !== undefined) {
        task.status = body.status;
        task.completed = body.status === "done";
    } else if (body.completed !== undefined) {
        task.completed = body.completed;
        task.status = body.completed ? "done" : "todo";
    }

    await task.save();
    res.json(task);
};

// DELETE /api/tasks/:id — 204 with no response body (conventional for DELETE).
export const deleteTask: RequestHandler = async (req, res) => {
    const { id } = req.params as { id: string };

    const result = await TaskModel.findByIdAndDelete(id).exec();
    if (!result) throw notFound("Task not found");

    res.status(204).end();
};
