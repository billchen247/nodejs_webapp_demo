/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/services/api.ts
 *
 * Thin wrapper around the backend REST API.
 *
 * New in Week 10:
 *   - Transparent token refresh. The access cookie now expires after 15
 *     minutes. On a 401 we try `POST /api/auth/refresh` ONCE and replay
 *     the original request. If the refresh also fails, the user is
 *     genuinely logged out and we surface the 401 to the caller.
 *
 *     Why do this in the fetch wrapper rather than in each page? So no
 *     component has to think about "did my cookie just expire mid-session?"
 *     — it just works, like a thermostat.
 *
 *   - `forgotPassword` / `resetPassword` entries in the auth namespace.
 */
import type { AuthUser, Task, UserRole } from "../types.js";

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ServerErrorBody {
  error?: string;
  details?: Record<string, string>;
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

/**
 * Attempt a single refresh. Returns true on success. We deliberately
 * avoid using `request()` here to prevent infinite recursion if refresh
 * also returns 401. We also serialise concurrent callers through a
 * single in-flight promise — otherwise a page that fires 5 requests at
 * once would try 5 parallel refreshes.
 */
let inflightRefresh: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

interface RequestOptions extends RequestInit {
  /** Internal flag so the retry does not loop forever. */
  _retrying?: boolean;
  /** Opt out of the auto-refresh (used by /me and /refresh itself). */
  noRefresh?: boolean;
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { _retrying, noRefresh, ...fetchInit } = init;

  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...fetchInit,
  });

  if (response.status === 401 && !_retrying && !noRefresh) {
    // Try to transparently refresh the session, exactly once.
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...init, _retrying: true });
    }
  }

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
        noRefresh: true,
      });
    },
    login(input: { email: string; password: string }): Promise<{ user: AuthUser }> {
      return request<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
        noRefresh: true,
      });
    },
    logout(): Promise<{ ok: true }> {
      return request<{ ok: true }>("/api/auth/logout", { method: "POST", noRefresh: true });
    },
    /**
     * `me` opts out of the auto-refresh — the whole point of /me is to
     * check whether we're logged in. Trying to refresh on 401 would
     * paper over "not logged in" responses.
     */
    me(): Promise<{ user: AuthUser | null }> {
      return request<{ user: AuthUser | null }>("/api/auth/me", { noRefresh: true });
    },
    forgotPassword(input: { email: string }): Promise<{ ok: true; devToken?: string }> {
      return request<{ ok: true; devToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(input),
        noRefresh: true,
      });
    },
    resetPassword(input: { token: string; newPassword: string }): Promise<{ ok: true }> {
      return request<{ ok: true }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input),
        noRefresh: true,
      });
    },
  },

  admin: {
    /** List every user. Server returns 401 or 403 to non-admins. */
    listUsers(): Promise<AuthUser[]> {
      return request<AuthUser[]>("/api/users");
    },
    /** Promote or demote a user. Returns the updated record. */
    updateRole(id: string, role: UserRole): Promise<AuthUser> {
      return request<AuthUser>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
  },
};
