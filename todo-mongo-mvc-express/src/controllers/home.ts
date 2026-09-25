/* ---------------------------------------------------------------------------
 * src/controllers/home.ts
 *
 * The landing page. Renders a friendly overview of the two coexisting
 * resources in this app:
 *
 *   * The legacy Todo demo — one flat list, no auth.
 *   * The Task Manager — Users, Projects, Tasks; requires signup/login.
 *
 * We show counts for both so the page doubles as a system-health smoke test
 * during development.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { TodoModel } from "../models/todo.js";
import { ProjectModel } from "../models/project.js";
import { TaskModel } from "../models/task.js";
import { UserModel } from "../models/user.js";

export const showHomePage: RequestHandler = async (_req, res) => {
    const [todoTotal, todoActive, todoDone, projects, tasks, users] = await Promise.all([
        TodoModel.estimatedDocumentCount(),
        TodoModel.countDocuments({ completed: false }),
        TodoModel.countDocuments({ completed: true }),
        ProjectModel.estimatedDocumentCount(),
        TaskModel.estimatedDocumentCount(),
        UserModel.estimatedDocumentCount(),
    ]);

    res.render("home", {
        title: "Home",
        todoCounts: { total: todoTotal, active: todoActive, completed: todoDone },
        managerCounts: { users, projects, tasks },
    });
};
