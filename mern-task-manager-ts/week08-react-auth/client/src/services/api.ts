/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: client/src/services/api.ts
 *
 * Thin wrapper around the backend REST API.
 *
 * New in Week 6:
 *   - Every fetch sets `credentials: "include"` so the browser attaches
 *     the HTTP-only auth cookie on cross-origin calls.
 *   - A small `auth` namespace for register / login / logout / me.
 */
import type { AuthUser, Task } from "../types.js";

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ServerErrorBody {
  error?: string;
  details?: unknown;
}

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Opt in to credentialed requests so cookies travel with us. Harmless
    // on same-origin calls; essential on cross-origin ones.
    credentials: "include",
    ...init,
  });

  if (response.status === 204) {
    return undefined as T;
  }

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
    return request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) });
  },
  updateTask(id: string, patch: Partial<Pick<Task, "title" | "description" | "completed">>): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(patch) });
  },
  deleteTask(id: string): Promise<void> {
    return request<void>(`/api/tasks/${id}`, { method: "DELETE" });
  },

  auth: {
    register(input: { email: string; password: string; name?: string }): Promise<{ user: AuthUser }> {
      return request<{ user: AuthUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    login(input: { email: string; password: string }): Promise<{ user: AuthUser }> {
      return request<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    logout(): Promise<{ ok: true }> {
      return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
    },
    me(): Promise<{ user: AuthUser | null }> {
      return request<{ user: AuthUser | null }>("/api/auth/me");
    },
  },
};
