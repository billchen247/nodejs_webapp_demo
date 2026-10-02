/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: client/src/services/api.ts
 *
 * Thin wrapper around the backend REST API.
 *
 * Why a service layer at all?
 *   React components should not know HTTP exists. They should ask for
 *   data in domain terms ("give me the tasks") and let a dedicated
 *   module worry about verbs, headers, JSON parsing, and error shapes.
 *   This separation pays off hard in later weeks when we add auth
 *   headers, retries, and request cancellation.
 *
 * Why plain `fetch` and not axios/react-query?
 *   `fetch` is built in and good enough for the shape of this app.
 *   Hiding it behind these functions means we could swap in react-query
 *   later without touching a single component.
 */
import type { Task } from "../types.js";

/**
 * Base URL for the backend. Comes from Vite's env (`VITE_API_URL`) at
 * build time; falls back to the dev-server default. We deliberately
 * do NOT read this at call time, so the compiled bundle is a pure
 * static artifact.
 */
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Shape of the error body our Express server returns. */
interface ServerErrorBody {
  error?: string;
  details?: unknown;
}

/**
 * A typed error thrown for any non-2xx response. The UI can `catch`
 * this and surface `.message` / `.status` without re-parsing the body.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly body: ServerErrorBody | null;

  constructor(message: string, status: number, body: ServerErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Perform a fetch and normalise the result. All callers go through
 * this helper so error handling lives in exactly one place.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  // 204 No Content: there is no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  // Attempt to read a body regardless of status. If the server sent
  // JSON we use it; otherwise we fall back to a stringified status.
  let body: unknown = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }

  if (!response.ok) {
    const errBody = (body as ServerErrorBody) ?? null;
    const message = errBody?.error ?? `HTTP ${response.status}`;
    throw new ApiError(message, response.status, errBody);
  }

  return body as T;
}

export const api = {
  listTasks(): Promise<Task[]> {
    return request<Task[]>("/api/tasks");
  },

  createTask(input: { title: string; description?: string }): Promise<Task> {
    return request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateTask(id: string, patch: Partial<Pick<Task, "title" | "description" | "completed">>): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
  },

  deleteTask(id: string): Promise<void> {
    return request<void>(`/api/tasks/${id}`, { method: "DELETE" });
  },
};
