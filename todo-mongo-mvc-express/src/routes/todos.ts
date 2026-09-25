/* ---------------------------------------------------------------------------
 * src/routes/todos.ts
 *
 * The ROUTE table for the /todos resource. Follows the classic Rails-ish
 * seven-action convention:
 *
 *   GET    /todos              → listTodos      (index)
 *   GET    /todos/new          → newTodoForm    (new)
 *   POST   /todos              → createTodo     (create)
 *   GET    /todos/:id          → showTodo       (show)
 *   GET    /todos/:id/edit     → editTodoForm   (edit)
 *   PUT    /todos/:id          → updateTodo     (update)   (via method-override)
 *   DELETE /todos/:id          → deleteTodo     (destroy)  (via method-override)
 *
 * Plus one convenience action for the list-page checkbox:
 *
 *   POST   /todos/:id/toggle   → toggleTodo
 *
 * IMPORTANT: `/todos/new` MUST be declared before `/todos/:id` — otherwise
 * Express will match "new" as the `:id` parameter and forward it to `showTodo`.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { Router } from "express";
import {
    listTodos,
    newTodoForm,
    createTodo,
    showTodo,
    editTodoForm,
    updateTodo,
    toggleTodo,
    deleteTodo,
} from "../controllers/todos.js";

export const todosRouter: Router = Router();

todosRouter.get("/", listTodos);
todosRouter.get("/new", newTodoForm);
todosRouter.post("/", createTodo);
todosRouter.get("/:id", showTodo);
todosRouter.get("/:id/edit", editTodoForm);
todosRouter.put("/:id", updateTodo);
todosRouter.post("/:id/toggle", toggleTodo);
todosRouter.delete("/:id", deleteTodo);
