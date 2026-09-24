/* ---------------------------------------------------------------------------
 * src/models/todos.js
 *
 * The "model" layer — everything that touches the data store lives here.
 * Because we don't have a real database, our "store" is just a JSON file
 * on disk (data/todos.json). Anywhere else in the code that needs to read
 * or write todos goes through this module.
 *
 * Splitting persistence out of the controllers is a standard REST-API
 * convention: if we ever swap the JSON file for MongoDB, Postgres, or a
 * cloud API, only THIS file needs to change.
 *
 * This file is intentionally identical to
 * ../todo-connect-api/src/models/todos.js — the model layer is framework-
 * agnostic, so it should not change when we swap Connect for Express.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

const fs = require("fs/promises");
const path = require("path");

// Absolute path to the "database" file. __dirname is the folder that
// contains THIS file (src/models), so we walk up two levels to the
// project root and then into data/.
const DATA_FILE = path.join(__dirname, "..", "..", "data", "todos.json");

// Read every todo from disk and return them as a JavaScript array.
async function readTodos() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf8");
        if (raw.trim() === "") return [];
        return JSON.parse(raw);
    } catch (err) {
        // ENOENT = "file does not exist". Treat first-run as empty list.
        if (err.code === "ENOENT") return [];
        throw err;
    }
}

// Persist the given array of todos back to disk as pretty-printed JSON.
async function writeTodos(todos) {
    const json = JSON.stringify(todos, null, 2);
    await fs.writeFile(DATA_FILE, json, "utf8");
}

module.exports = { DATA_FILE, readTodos, writeTodos };
