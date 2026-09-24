/* ---------------------------------------------------------------------------
 * src/routes/students.js
 *
 * `express.Router()` is the piece Connect deliberately leaves out. It lets
 * us map HTTP verb + path pattern directly to a controller function —
 * including path params like `:id` — instead of hand-writing the pathname
 * split + segment matching we did in
 * ../todo-connect-api/src/router.js.
 *
 * Layout mirrors the connect router's cases 1-for-1:
 *
 *   GET    /api/students           -> listStudents      (optional ?completed=)
 *   POST   /api/students           -> createStudent
 *   GET    /api/students/:id       -> getStudentById
 *   PUT    /api/students/:id       -> updateStudent
 *   DELETE /api/students/:id       -> deleteStudent
 *
 * Method-not-allowed (405) is handled by the `.all()` catch-all at the
 * bottom of each path — Express does not do this for us, but it is one
 * line per path here versus manual `res.setHeader("Allow", ...)` calls
 * scattered through the connect router.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const express = require("express");
const controller = require("../controllers/students");

const router = express.Router();

router
    .route("/")
    .get(controller.listStudents)
    .post(controller.createStudent)
    .all((req, res) => {
        res.set("Allow", "GET, POST");
        res.status(405).json({ error: "Method Not Allowed" });
    });

router
    .route("/:id")
    .get(controller.getStudentById)
    .put(controller.updateStudent)
    .delete(controller.deleteStudent)
    .all((req, res) => {
        res.set("Allow", "GET, PUT, DELETE");
        res.status(405).json({ error: "Method Not Allowed" });
    });

module.exports = router;
