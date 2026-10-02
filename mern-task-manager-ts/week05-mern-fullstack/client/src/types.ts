/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: client/src/types.ts
 *
 * Shared frontend types.
 *
 * We duplicate the shape of a Task here rather than importing it from the
 * backend. That is intentional: in Weeks 5+ the frontend will receive JSON
 * from an HTTP response, and the shape it sees over the wire can differ
 * from the Mongoose document (e.g. dates come as strings).
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
