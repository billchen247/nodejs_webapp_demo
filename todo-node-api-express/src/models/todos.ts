/* ---------------------------------------------------------------------------
 * src/models/todos.ts
 *
 * The "model" layer — everything that touches the data store lives here.
 * Same JSON-file "database" as the two sister projects, so learners can diff
 * them directly:
 *
 *   ../todo-node-api/src/models/todos.js        raw http
 *   ../todo-connect-api/src/models/todos.js     Connect
 *   this file                                    Express + TypeScript
 *
 * Type note
 * ---------
 * `Todo` is exported so route handlers and the OpenAPI generator can share
 * one canonical shape. If we ever migrate to a real DB, this interface stays;
 * only `readTodos` / `writeTodos` change.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname doesn't exist in ESM. Reconstruct it from import.meta.url so we
// can build paths relative to THIS file.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path to the "database" file: <project-root>/data/todos.json
export const DATA_FILE: string = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "todos.json"
);

export interface Todo {
    id: number;
    title: string;
    completed: boolean;
    createdAt: string; // ISO-8601 timestamp
}

// Read every todo from disk and return them as a typed array.
export async function readTodos(): Promise<Todo[]> {
    try {
        const raw = await readFile(DATA_FILE, "utf8");
        if (raw.trim() === "") return [];
        return JSON.parse(raw) as Todo[];
    } catch (err) {
        // ENOENT = "file does not exist". Treat first-run as empty list.
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw err;
    }
}

// Persist the given array of todos back to disk as pretty-printed JSON.
export async function writeTodos(todos: Todo[]): Promise<void> {
    const json = JSON.stringify(todos, null, 2);
    await writeFile(DATA_FILE, json, "utf8");
}
