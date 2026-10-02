/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
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

/** The current user, as returned by `/api/auth/me`. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
