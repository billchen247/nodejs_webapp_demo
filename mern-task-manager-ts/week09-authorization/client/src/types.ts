/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/types.ts
 */

/** A task object as the frontend sees it. */
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

/** The filter buttons we support in the UI. */
export type TaskFilter = "all" | "active" | "completed";

/** Roles the backend knows about. Must match the server's USER_ROLES. */
export type UserRole = "user" | "admin";

/** The current user, as returned by `/api/auth/me`. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** Added in Week 9. The React app uses this to render role-aware UI. */
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}
