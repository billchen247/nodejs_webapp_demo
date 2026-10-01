/* =============================================================================
 * src/api/todos.ts — fetch wrapper around the backend REST API
 * =============================================================================
 *
 * All HTTP calls live in this one file so components stay focused on UI.
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

import type { Todo, CreateTodoInput, UpdateTodoInput } from "../types/todo";

const BASE_URL = "/api/todos";

/**
 * Thin wrapper that turns any non-2xx response into a thrown Error.
 * React components can then `try/catch` or let an error boundary catch it.
 */
async function request<T>(
    url: string,
    init: RequestInit = {},
): Promise<T> {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });

    if (!res.ok) {
        // Try to pull a server-side error message out of the JSON body.
        let message = `HTTP ${res.status}`;
        try {
            const body = (await res.json()) as { error?: string };
            if (body.error) message = body.error;
        } catch {
            /* body wasn't JSON — fall back to the status text */
        }
        throw new Error(message);
    }

    // 204 No Content → nothing to parse. Cast to T; callers of DELETE
    // use `Promise<void>` so this unused value is harmless.
    if (res.status === 204) return undefined as T;

    return (await res.json()) as T;
}

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
