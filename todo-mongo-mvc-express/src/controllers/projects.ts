/* ---------------------------------------------------------------------------
 * src/controllers/projects.ts
 *
 * The CRUD controller for /projects. All handlers assume `requireAuth` ran
 * ahead of them, so `req.currentUser` is set (see `assertUser`).
 *
 * Ownership rule
 *   * Anyone signed in can VIEW every project (index + show).
 *   * Only the project's `owner` can edit or delete it.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { ProjectModel } from "../models/project.js";
import { TaskModel } from "../models/task.js";
import { UserModel } from "../models/user.js";
import { createProjectSchema, updateProjectSchema } from "../schemas/project.js";
import { HttpError } from "../utils/http-error.js";
import { flattenZod } from "../utils/flatten-zod.js";
import { assertUser } from "../middleware/auth.js";

/* --- GET /projects ---------------------------------------------------- */
export const listProjects: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);

    // Optional filter — "mine" restricts to projects the current user owns.
    const scope = String(req.query["scope"] ?? "all");
    const query: Record<string, unknown> = {};
    if (scope === "mine") query["owner"] = currentUser._id;

    const projects = await ProjectModel.find(query)
        .sort({ createdAt: -1 })
        .populate<{ owner: { _id: mongoose.Types.ObjectId; name: string } }>("owner", "name")
        .lean();

    // Batch-count tasks per project in one aggregation — avoids N+1.
    const projectIds = projects.map((p) => p._id);
    const taskCounts = new Map<string, number>();
    if (projectIds.length > 0) {
        const counts = await TaskModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
            { $match: { project: { $in: projectIds } } },
            { $group: { _id: "$project", count: { $sum: 1 } } },
        ]);
        for (const c of counts) taskCounts.set(String(c._id), c.count);
    }

    const items = projects.map((p) => ({
        id: String(p._id),
        name: p.name,
        description: p.description,
        owner: String(p.owner?._id ?? ""),
        ownerName: p.owner?.name ?? "(deleted)",
        isMine: String(p.owner?._id ?? "") === String(currentUser._id),
        taskCount: taskCounts.get(String(p._id)) ?? 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    }));

    res.render("projects/index", {
        title: "Projects",
        projects: items,
        scope,
    });
};

/* --- GET /projects/new ------------------------------------------------ */
export const newProjectForm: RequestHandler = (_req, res) => {
    res.render("projects/new", {
        title: "New project",
        values: { name: "", description: "" },
        errors: {},
    });
};

/* --- POST /projects --------------------------------------------------- */
export const createProject: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).render("projects/new", {
            title: "New project",
            values: req.body ?? {},
            errors: flattenZod(parsed.error),
        });
        return;
    }

    try {
        const created = await ProjectModel.create({
            name: parsed.data.name,
            description: parsed.data.description ?? "",
            owner: currentUser._id,
        });
        req.session.flash = { type: "success", message: `Project "${created.name}" created` };
        res.redirect(`/projects/${created._id}`);
    } catch (err) {
        // Duplicate (owner, name) — surface a friendly field-level error.
        if (isDuplicateKey(err)) {
            res.status(400).render("projects/new", {
                title: "New project",
                values: req.body ?? {},
                errors: { name: "You already have a project with this name" },
            });
            return;
        }
        throw err;
    }
};

/* --- GET /projects/:id ------------------------------------------------ */
export const showProject: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const id = String(req.params["id"]);
    ensureValidProjectId(id);

    const project = await ProjectModel.findById(id).populate<{
        owner: { _id: mongoose.Types.ObjectId; name: string; email: string };
    }>("owner", "name email");
    if (!project) throw new HttpError(404, "Project not found");

    // Board columns — group tasks by status so the view can render a 3-column
    // kanban without further logic.
    const tasks = await TaskModel.find({ project: project._id })
        .sort({ priority: 1, createdAt: -1 })
        .populate<{ assignee: { _id: mongoose.Types.ObjectId; name: string } | null }>(
            "assignee",
            "name"
        )
        .lean();

    const board = {
        todo: [] as ReturnType<typeof toTaskView>[],
        in_progress: [] as ReturnType<typeof toTaskView>[],
        done: [] as ReturnType<typeof toTaskView>[],
    };
    for (const t of tasks) {
        const view = toTaskView(t);
        board[view.status].push(view);
    }

    res.render("projects/show", {
        title: project.name,
        project: {
            id: String(project._id),
            name: project.name,
            description: project.description,
            owner: String(project.owner?._id ?? ""),
            ownerName: project.owner?.name ?? "(deleted)",
            ownerEmail: project.owner?.email ?? "",
            isMine: String(project.owner?._id ?? "") === String(currentUser._id),
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        },
        board,
        totalTasks: tasks.length,
    });
};

/* --- GET /projects/:id/edit ------------------------------------------ */
export const editProjectForm: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const id = String(req.params["id"]);
    ensureValidProjectId(id);

    const project = await ProjectModel.findById(id);
    if (!project) throw new HttpError(404, "Project not found");
    if (String(project.owner) !== String(currentUser._id)) {
        throw new HttpError(403, "Only the project owner can edit this project");
    }

    res.render("projects/edit", {
        title: `Edit: ${project.name}`,
        project: project.toObject(),
        values: { name: project.name, description: project.description },
        errors: {},
    });
};

/* --- PUT /projects/:id ----------------------------------------------- */
export const updateProject: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const id = String(req.params["id"]);
    ensureValidProjectId(id);

    const project = await ProjectModel.findById(id);
    if (!project) throw new HttpError(404, "Project not found");
    if (String(project.owner) !== String(currentUser._id)) {
        throw new HttpError(403, "Only the project owner can edit this project");
    }

    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).render("projects/edit", {
            title: `Edit: ${project.name}`,
            project: project.toObject(),
            values: req.body ?? {},
            errors: flattenZod(parsed.error),
        });
        return;
    }

    project.name = parsed.data.name;
    project.description = parsed.data.description ?? "";
    try {
        await project.save();
    } catch (err) {
        if (isDuplicateKey(err)) {
            res.status(400).render("projects/edit", {
                title: `Edit: ${project.name}`,
                project: project.toObject(),
                values: req.body ?? {},
                errors: { name: "You already have a project with this name" },
            });
            return;
        }
        throw err;
    }

    req.session.flash = { type: "success", message: "Project updated" };
    res.redirect(`/projects/${project._id}`);
};

/* --- DELETE /projects/:id -------------------------------------------- */
export const deleteProject: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const id = String(req.params["id"]);
    ensureValidProjectId(id);

    const project = await ProjectModel.findById(id);
    if (!project) throw new HttpError(404, "Project not found");
    if (String(project.owner) !== String(currentUser._id)) {
        throw new HttpError(403, "Only the project owner can delete this project");
    }

    // Cascade: delete every task belonging to the project too. There's no
    // ON DELETE CASCADE in MongoDB — we do it explicitly.
    await TaskModel.deleteMany({ project: project._id });
    await project.deleteOne();

    req.session.flash = { type: "success", message: `Project "${project.name}" deleted` };
    res.redirect("/projects");
};

/* --- helpers ---------------------------------------------------------- */

function ensureValidProjectId(id: string): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new HttpError(400, "Invalid Project ID");
    }
}

function isDuplicateKey(err: unknown): boolean {
    return (
        err !== null &&
        typeof err === "object" &&
        (err as { code?: number }).code === 11000
    );
}

function toTaskView(t: {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: Date | null;
    project: mongoose.Types.ObjectId;
    assignee?: { _id: mongoose.Types.ObjectId; name: string } | mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    const assigneeName =
        t.assignee && typeof t.assignee === "object" && "name" in t.assignee
            ? (t.assignee as { name: string }).name
            : null;
    const assigneeId =
        t.assignee && typeof t.assignee === "object" && "_id" in t.assignee
            ? String((t.assignee as { _id: mongoose.Types.ObjectId })._id)
            : t.assignee
              ? String(t.assignee)
              : null;
    return {
        id: String(t._id),
        title: t.title,
        description: t.description,
        status: t.status as "todo" | "in_progress" | "done",
        priority: t.priority as "low" | "medium" | "high",
        dueDate: t.dueDate ?? null,
        project: String(t.project),
        assigneeId,
        assigneeName,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
}

// Referenced above so we can bulk-load assignees for a form. Exported so the
// tasks controller can share the same helper when building forms.
export async function loadAssignableUsers(): Promise<{ id: string; name: string; email: string }[]> {
    const users = await UserModel.find({}).sort({ name: 1 }).lean();
    return users.map((u) => ({ id: String(u._id), name: u.name, email: u.email }));
}
