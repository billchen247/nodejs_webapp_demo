/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: src/data/tasks.ts
 *
 * Still an in-memory store this week — the database comes in Week 3.
 *
 * New in Week 2:
 *   - helpers for creating, updating, and deleting tasks (the C/U/D of CRUD).
 *   - an auto-incrementing id generator so new tasks get unique ids.
 */

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

/**
 * Fields the client is allowed to send when CREATING a task.
 *
 * `id` is intentionally NOT here: ids are the server's job. Letting the
 * client pick its own id is a classic source of collisions and security
 * problems ("I'll just claim id 1 and overwrite your task").
 */
export interface NewTaskInput {
  title: string;
  description?: string;
  completed?: boolean;
}

/**
 * Fields the client is allowed to send when UPDATING a task.
 *
 * All optional because PUT is used as a partial update in this classroom
 * API — simpler for students than teaching the full PUT-vs-PATCH distinction
 * on day one.
 */
export interface TaskUpdateInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

let tasks: Task[] = [];
let nextId = 1;

/**
 * Reset the store to a known seed. Used by tests and at module load so the
 * server starts up with example data.
 */
export function _resetTasksForTests(): void {
  tasks = [
    {
      id: 1,
      title: "Learn Express",
      description: "Replace raw http with a real routing framework.",
      completed: false,
    },
    {
      id: 2,
      title: "Build CRUD endpoints",
      description: "GET, POST, PUT, DELETE — the full REST surface.",
      completed: false,
    },
    {
      id: 3,
      title: "Write API tests",
      description: "Use Supertest to prove each endpoint behaves.",
      completed: true,
    },
  ];
  // After reseeding, the next new task should land at id 4.
  nextId = tasks.length + 1;
}
_resetTasksForTests();

export function getAllTasks(): Task[] {
  return [...tasks];
}

export function getTaskById(id: number): Task | undefined {
  return tasks.find((t) => t.id === id);
}

/**
 * Create a new task.
 *
 * This is where the data layer takes responsibility for the id and for
 * supplying defaults. If we ever change the id strategy (string ids,
 * ObjectIds, UUIDs), only this file changes.
 */
export function createTask(input: NewTaskInput): Task {
  const task: Task = {
    id: nextId++,
    title: input.title,
    description: input.description ?? "",
    completed: input.completed ?? false,
  };
  tasks.push(task);
  return task;
}

/**
 * Partially update a task. Returns `undefined` if no task matches.
 *
 * We intentionally never let the client change the id, even if they send
 * one in the body. The id is the primary key and the URL already identifies
 * which record to update.
 */
export function updateTask(id: number, patch: TaskUpdateInput): Task | undefined {
  const task = tasks.find((t) => t.id === id);
  if (!task) return undefined;
  if (patch.title !== undefined) task.title = patch.title;
  if (patch.description !== undefined) task.description = patch.description;
  if (patch.completed !== undefined) task.completed = patch.completed;
  return task;
}

/**
 * Delete a task by id. Returns `true` if something was deleted.
 *
 * Returning a boolean (rather than throwing) keeps the controller simple:
 * it can turn `false` into a 404 without a try/catch.
 */
export function deleteTask(id: number): boolean {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  return tasks.length < before;
}
