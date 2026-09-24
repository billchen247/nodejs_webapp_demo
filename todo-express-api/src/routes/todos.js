/* ---------------------------------------------------------------------------
 * src/routes/todos.js
 *
 * `express.Router()` is the piece Connect deliberately leaves out. It lets
 * us map HTTP verb + path pattern directly to a controller function —
 * including path params like `:id` — instead of hand-writing the pathname
 * split + segment matching we did in
 * ../todo-connect-api/src/router.js.
 *
 * Layout mirrors the connect router's cases 1-for-1:
 *
 *   GET    /api/todos           -> listTodos      (optional ?completed=)
 *   POST   /api/todos           -> createTodo
 *   GET    /api/todos/:id       -> getTodoById
 *   PUT    /api/todos/:id       -> updateTodo
 *   DELETE /api/todos/:id       -> deleteTodo
 *
 * Method-not-allowed (405) is handled by the `.all()` catch-all at the
 * bottom of each path — Express does not do this for us, but it is one
 * line per path here versus manual `res.setHeader("Allow", ...)` calls
 * scattered through the connect router.
 * -------------------------------------------------------------------------*/

const express = require("express");
const controller = require("../controllers/todos");

const router = express.Router();

router
    .route("/")
    .get(controller.listTodos)
    .post(controller.createTodo)
    .all((req, res) => {
        res.set("Allow", "GET, POST");
        res.status(405).json({ error: "Method Not Allowed" });
    });

router
    .route("/:id")
    .get(controller.getTodoById)
    .put(controller.updateTodo)
    .delete(controller.deleteTodo)
    .all((req, res) => {
        res.set("Allow", "GET, PUT, DELETE");
        res.status(405).json({ error: "Method Not Allowed" });
    });

module.exports = router;
