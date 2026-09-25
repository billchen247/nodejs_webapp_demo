/* ---------------------------------------------------------------------------
 * src/controllers/home.ts
 *
 * The landing page. Unlike the JSON-API sibling, we render an EJS template
 * instead of serving a static HTML file.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import { TodoModel } from "../models/todo.js";

export const showHomePage: RequestHandler = async (_req, res) => {
    const [total, active, completed] = await Promise.all([
        TodoModel.estimatedDocumentCount(),
        TodoModel.countDocuments({ completed: false }),
        TodoModel.countDocuments({ completed: true }),
    ]);

    res.render("home", {
        title: "Home",
        counts: { total, active, completed },
    });
};
