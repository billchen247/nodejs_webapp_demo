/* =============================================================================
 * src/api/todos.ts — fetch wrapper around the backend REST API
 * =============================================================================
 *
 * Endpoint calls use the shared fetch wrapper so components stay focused on UI.
 * We use the built-in `fetch` (no axios needed for a learning project).
 *
 * Why relative URLs (`/api/todos`) and not `http://localhost:4000/api/todos`?
 *   • In **dev**, Vite's proxy (see vite.config.ts) forwards `/api/*` to
 *     the backend. The browser never sees two origins → no CORS prompt
 *     during development.
 *   • In **prod**, you deploy both apps behind the same domain (or set up
 *     your reverse proxy to do the same thing). Code doesn't change.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import type { Todo, CreateTodoInput, UpdateTodoInput } from "../types/todo.ts";
import { request } from "./common.ts";

const BASE_URL = "/api/todos";

/* ---------- Public API — one function per endpoint ------------------- */

export const todosApi = {
    list(): Promise<Todo[]> {
        return request<Todo[]>(BASE_URL);
    },

    get(id: string): Promise<Todo> {
        return request<Todo>(`${BASE_URL}/${id}`);
    },

    create(input: CreateTodoInput): Promise<Todo> {
        return request<Todo>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(input),
        });
    },

    update(id: string, patch: UpdateTodoInput): Promise<Todo> {
        return request<Todo>(`${BASE_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        });
    },

    remove(id: string): Promise<void> {
        return request<void>(`${BASE_URL}/${id}`, { method: "DELETE" });
    },
};
