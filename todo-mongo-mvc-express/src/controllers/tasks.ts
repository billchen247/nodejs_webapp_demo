/* ---------------------------------------------------------------------------
 * src/controllers/tasks.ts
 *
 * CRUD controller for tasks. Tasks are nested under a project — every URL
 * starts with `/projects/:projectId/tasks/…`. The `mergeParams: true` router
 * option in `src/routes/tasks.ts` is what makes `req.params.projectId`
 * available to these handlers.
 *
 * Authorisation
 *   * `requireAuth` guards every route.
 *   * Only the parent project's owner can create / edit / delete tasks. This
 *     keeps the model simple; a "members" collection is the natural next
 *     iteration but out of scope for this demo.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { TaskModel, TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from "../models/task.js";
import { ProjectModel, type ProjectDoc } from "../models/project.js";
import { createTaskSchema, updateTaskSchema, changeStatusSchema } from "../schemas/task.js";
import { HttpError } from "../utils/http-error.js";
import { flattenZod } from "../utils/flatten-zod.js";
import { assertUser } from "../middleware/auth.js";
import { loadAssignableUsers } from "./projects.js";

/* --- GET /projects/:projectId/tasks/new ------------------------------- */
export const newTaskForm: RequestHandler = async (req, res) => {
    const project = await loadOwnedProject(req);
    const assignees = await loadAssignableUsers();

    res.render("tasks/new", {
        title: `New task · ${project.name}`,
        project: project.toObject(),
        assignees,
        values: {
            title: "",
            description: "",
            status: "todo",
            priority: "medium",
            dueDate: "",
            assignee: "",
        },
        errors: {},
        statusLabels: TASK_STATUS_LABEL,
        priorityLabels: TASK_PRIORITY_LABEL,
    });
};

/* --- POST /projects/:projectId/tasks --------------------------------- */
export const createTask: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const project = await loadOwnedProject(req);

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        const assignees = await loadAssignableUsers();
        res.status(400).render("tasks/new", {
            title: `New task · ${project.name}`,
            project: project.toObject(),
            assignees,
            values: req.body ?? {},
            errors: flattenZod(parsed.error),
            statusLabels: TASK_STATUS_LABEL,
            priorityLabels: TASK_PRIORITY_LABEL,
        });
        return;
    }

    await TaskModel.create({
        title: parsed.data.title,
        description: parsed.data.description ?? "",
        status: parsed.data.status ?? "todo",
        priority: parsed.data.priority ?? "medium",
        dueDate: parsed.data.dueDate ?? null,
        project: project._id,
        assignee: parsed.data.assignee ?? null,
        createdBy: currentUser._id,
    });

    req.session.flash = { type: "success", message: "Task created" };
    res.redirect(`/projects/${project._id}`);
};

/* --- GET /projects/:projectId/tasks/:id ------------------------------ */
export const showTask: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const { project, task } = await loadProjectAndTask(req);
    const isOwner = String(project.owner) === String(currentUser._id);

    res.render("tasks/show", {
        title: task.title,
        project: project.toObject(),
        task: await hydrateTaskForView(task._id),
        isOwner,
        statusLabels: TASK_STATUS_LABEL,
        priorityLabels: TASK_PRIORITY_LABEL,
    });
};

/* --- GET /projects/:projectId/tasks/:id/edit ------------------------- */
export const editTaskForm: RequestHandler = async (req, res) => {
    const project = await loadOwnedProject(req);
    const { task } = await loadProjectAndTask(req);
    const assignees = await loadAssignableUsers();

    res.render("tasks/edit", {
        title: `Edit: ${task.title}`,
        project: project.toObject(),
        task: task.toObject(),
        assignees,
        values: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "",
            assignee: task.assignee ? String(task.assignee) : "",
        },
        errors: {},
        statusLabels: TASK_STATUS_LABEL,
        priorityLabels: TASK_PRIORITY_LABEL,
    });
};

/* --- PUT /projects/:projectId/tasks/:id ------------------------------ */
export const updateTask: RequestHandler = async (req, res) => {
    const project = await loadOwnedProject(req);
    const { task } = await loadProjectAndTask(req);

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        const assignees = await loadAssignableUsers();
        res.status(400).render("tasks/edit", {
            title: `Edit: ${task.title}`,
            project: project.toObject(),
            task: task.toObject(),
            assignees,
            values: req.body ?? {},
            errors: flattenZod(parsed.error),
            statusLabels: TASK_STATUS_LABEL,
            priorityLabels: TASK_PRIORITY_LABEL,
        });
        return;
    }

    task.title = parsed.data.title;
    task.description = parsed.data.description ?? "";
    task.status = parsed.data.status;
    task.priority = parsed.data.priority;
    task.dueDate = parsed.data.dueDate ?? null;
    task.assignee = (parsed.data.assignee ?? null) as unknown as typeof task.assignee;

    await task.save();

    req.session.flash = { type: "success", message: "Task updated" };
    res.redirect(`/projects/${project._id}`);
};

/* --- POST /projects/:projectId/tasks/:id/status ---------------------- */
// Board "quick move" — the kanban view posts a single new status.
export const changeStatus: RequestHandler = async (req, res) => {
    const project = await loadOwnedProject(req);
    const { task } = await loadProjectAndTask(req);

    const parsed = changeStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new HttpError(400, "Invalid status");
    }

    task.status = parsed.data.status;
    await task.save();

    res.redirect(`/projects/${project._id}`);
};

/* --- DELETE /projects/:projectId/tasks/:id --------------------------- */
export const deleteTask: RequestHandler = async (req, res) => {
    const project = await loadOwnedProject(req);
    const { task } = await loadProjectAndTask(req);

    await task.deleteOne();
    req.session.flash = { type: "success", message: "Task deleted" };
    res.redirect(`/projects/${project._id}`);
};

/* --- helpers --------------------------------------------------------- */

function ensureValidId(id: string, label: string): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new HttpError(400, `Invalid ${label} ID`);
    }
}

// Loads the project referenced by `:projectId` AND verifies the current user
// owns it. Every mutating task action goes through this.
async function loadOwnedProject(req: Parameters<RequestHandler>[0]): Promise<ProjectDoc> {
    const currentUser = assertUser(req);
    const projectId = String(req.params["projectId"]);
    ensureValidId(projectId, "Project");

    const project = await ProjectModel.findById(projectId);
    if (!project) throw new HttpError(404, "Project not found");
    if (String(project.owner) !== String(currentUser._id)) {
        throw new HttpError(403, "Only the project owner can modify its tasks");
    }
    return project;
}

// Load both project and task WITHOUT the ownership check (view flows: the
// list/show pages let any signed-in user look at any project's tasks).
async function loadProjectAndTask(req: Parameters<RequestHandler>[0]) {
    assertUser(req);
    const projectId = String(req.params["projectId"]);
    const taskId = String(req.params["id"]);
    ensureValidId(projectId, "Project");
    ensureValidId(taskId, "Task");

    const project = await ProjectModel.findById(projectId);
    if (!project) throw new HttpError(404, "Project not found");

    const task = await TaskModel.findOne({ _id: taskId, project: project._id });
    if (!task) throw new HttpError(404, "Task not found");

    return { project, task };
}

// Re-loads a task with populated refs for the show page.
async function hydrateTaskForView(taskId: mongoose.Types.ObjectId) {
    const t = await TaskModel.findById(taskId)
        .populate<{ assignee: { _id: mongoose.Types.ObjectId; name: string; email: string } | null }>(
            "assignee",
            "name email"
        )
        .populate<{ createdBy: { _id: mongoose.Types.ObjectId; name: string } }>(
            "createdBy",
            "name"
        )
        .lean();
    if (!t) throw new HttpError(404, "Task not found");
    return {
        id: String(t._id),
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        project: String(t.project),
        assignee: t.assignee
            ? { id: String(t.assignee._id), name: t.assignee.name, email: t.assignee.email }
            : null,
        createdBy: { id: String(t.createdBy?._id ?? ""), name: t.createdBy?.name ?? "(deleted)" },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
}
