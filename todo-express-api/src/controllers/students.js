/* ---------------------------------------------------------------------------
 * src/controllers/students.js
 *
 * The "controller" layer for the /api/students resource. Each exported function
 * is a small async request handler that:
 *
 *   1. Validates the request (id, body, ...).
 *   2. Calls the model (src/models/students.js) to read or write data.
 *   3. Sends a response using Express's res.json() / res.status() helpers.
 *
 * Because `express.json()` middleware runs before us, `req.body` is already
 * a parsed JavaScript object. We do NOT read the request stream ourselves.
 *
 * Contrast with ../student-connect-api/src/controllers/students.js: same logic,
 * but here we call `res.status(400).json({...})` instead of the custom
 * `sendError(res, 400, "...")` helper — Express bakes those helpers in.
 *
 * Any thrown error automatically flows to the error middleware because
 * these handlers are async and Express 4.x+ funnels rejected promises to
 * `next(err)` when we return them. We use the returned-promise style below
 * so we never have to write a try/catch here.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const { readStudents, writeStudents } = require("../models/students");
const { parseStudentId } = require("../utils/validation");

// GET /api/students
// GET /api/students?completed=true
// GET /api/students?completed=false
//
// "completed" is a QUERY PARAMETER (after the "?"). Express parses the query
// string into req.query for us — the equivalent of url.searchParams in the
// connect version.
async function listStudents(req, res) {
    const students = await readStudents();
    const completed = req.query.completed;

    if (completed === "true") {
        return res.json(students.filter((t) => t.completed === true));
    }
    if (completed === "false") {
        return res.json(students.filter((t) => t.completed === false));
    }
    res.json(students);
}

// GET /api/students/:id
//   200 OK        found
//   400 Bad Req.  id is not a positive integer
//   404 Not Found no student with that id
async function getStudentById(req, res) {
    const id = parseStudentId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid Student ID" });

    const students = await readStudents();
    const student = students.find((t) => t.id === id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json(student);
}

// POST /api/students
// Body: { "title": "Learn Express" }
//
// Only `title` is accepted from the client. The server generates `id`,
// `completed` (defaults to false), and `createdAt` — never trust the
// client to invent primary keys or timestamps.
async function createStudent(req, res) {
    const body = req.body || {};

    if (typeof body.title !== "string" || body.title.trim() === "") {
        return res
            .status(400)
            .json({ error: "Field 'title' is required and must be a non-empty string" });
    }

    const students = await readStudents();
    const nextId = students.length === 0 ? 1 : Math.max(...students.map((t) => t.id)) + 1;

    const student = {
        id: nextId,
        title: body.title.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
    };

    students.push(student);
    await writeStudents(students);

    // 201 Created is the correct status for "a new resource was made".
    res.status(201).json(student);
}

// PUT /api/students/:id
// Body: { "title": "...", "completed": true }
//
// Both fields are optional; missing fields are left unchanged. Unknown fields
// (like a fake `id` or `createdAt`) are silently ignored.
async function updateStudent(req, res) {
    const id = parseStudentId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid Student ID" });

    const body = req.body || {};

    const students = await readStudents();
    const index = students.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "Student not found" });

    if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim() === "") {
            return res
                .status(400)
                .json({ error: "Field 'title' must be a non-empty string" });
        }
        students[index].title = body.title.trim();
    }
    if (body.completed !== undefined) {
        if (typeof body.completed !== "boolean") {
            return res
                .status(400)
                .json({ error: "Field 'completed' must be a boolean" });
        }
        students[index].completed = body.completed;
    }

    await writeStudents(students);
    res.json(students[index]);
}

// DELETE /api/students/:id
//   204 No Content   deleted (no response body — conventional for DELETE)
//   400 Bad Req.     invalid id
//   404 Not Found    no student with that id
async function deleteStudent(req, res) {
    const id = parseStudentId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid Student ID" });

    const students = await readStudents();
    const index = students.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: "Student not found" });

    students.splice(index, 1);
    await writeStudents(students);

    // 204 explicitly means "success, and there is NO response body".
    res.status(204).end();
}

module.exports = { listStudents, getStudentById, createStudent, updateStudent, deleteStudent };
