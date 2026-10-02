/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 01
 * File: src/data/tasks.ts
 *
 * This file is the data layer for Week 1.
 *
 * There is no database yet: tasks live in a plain JavaScript array in memory.
 * That means the data resets every time the server restarts — perfectly fine
 * for learning, and it keeps the lesson focused on Node, TypeScript, and HTTP.
 *
 * In Week 3 we will replace this file with MongoDB (via Mongoose), and the
 * rest of the app will barely change. Being able to swap the data layer is
 * exactly why we separate the shape of a Task from where it is stored.
 */

/**
 * The Task interface describes the *shape* of a task object anywhere in the app.
 *
 * Why bother with an interface in a tiny project?
 *   - It documents the contract between files. A reader can look at Task and
 *     immediately know what fields exist and what their types are.
 *   - TypeScript will catch typos like `task.titel` at compile time.
 *   - When we add fields in later weeks (userId, createdAt, ...), the compiler
 *     will tell us every place that needs to be updated.
 */
export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

/**
 * The in-memory store. Exported as `let` so we can push/filter later weeks,
 * but the array reference itself is kept module-private by convention — callers
 * go through the helper functions below.
 */
let tasks: Task[] = [
  {
    id: 1,
    title: "Learn Node.js",
    description: "Understand the Node runtime, event loop, and modules.",
    completed: true,
  },
  {
    id: 2,
    title: "Learn TypeScript",
    description: "Add types to JavaScript to catch bugs before they run.",
    completed: false,
  },
  {
    id: 3,
    title: "Build an HTTP server",
    description: "Use Node's built-in http module to answer requests.",
    completed: false,
  },
];

/** Return a snapshot of all tasks. */
export function getAllTasks(): Task[] {
  // Returning a copy prevents callers from accidentally mutating our store.
  // This is a small habit that will matter a lot once real data is involved.
  return [...tasks];
}

/**
 * Find a task by its numeric id.
 *
 * Returns `undefined` (not `null`) when no task matches, because that is what
 * Array.prototype.find returns, and consistency with the standard library
 * makes the type signature easier for students to reason about.
 */
export function getTaskById(id: number): Task | undefined {
  return tasks.find((t) => t.id === id);
}

/**
 * Reset the store back to the seed data.
 *
 * Only used by tests so that each test starts from a known state. Exporting
 * this (rather than mutating `tasks` directly from tests) keeps the data
 * layer in control of its own invariants.
 */
export function _resetTasksForTests(): void {
  tasks = [
    {
      id: 1,
      title: "Learn Node.js",
      description: "Understand the Node runtime, event loop, and modules.",
      completed: true,
    },
    {
      id: 2,
      title: "Learn TypeScript",
      description: "Add types to JavaScript to catch bugs before they run.",
      completed: false,
    },
    {
      id: 3,
      title: "Build an HTTP server",
      description: "Use Node's built-in http module to answer requests.",
      completed: false,
    },
  ];
}
