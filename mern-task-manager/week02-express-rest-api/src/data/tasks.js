/**
 * @file src/data/tasks.js
 * @author Bill Chen
 * @description Week 2 — in-memory task "database".
 *
 * There is still no real database. The `tasks` array is mutated by the
 * controllers — items are pushed on create, modified on update, spliced
 * on delete. All of it lives in process memory and will reset to the
 * seed data when the server restarts.
 *
 * Why do this before MongoDB? So students focus on routing, HTTP
 * semantics, and JSON shapes without having to install Mongo first.
 */

export const tasks = [
  {
    id: 1,
    title: "Read the Week 2 README",
    description: "Understand what Express gives us over plain Node.",
    completed: true,
  },
  {
    id: 2,
    title: "Try every CRUD endpoint",
    description: "GET, POST, PUT, DELETE from the terminal with curl.",
    completed: false,
  },
];

/**
 * Generate the next id for a brand-new task. We take max(ids) + 1 so that
 * ids remain monotonically increasing even after deletions.
 */
export function nextId() {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map((t) => t.id)) + 1;
}

/**
 * Reset the array back to the seed state. Used by the test suite so each
 * test starts with a predictable baseline (otherwise ordering between
 * tests would matter, which is a classic source of flaky tests).
 */
export function resetTasks() {
  tasks.length = 0;
  tasks.push(
    {
      id: 1,
      title: "Read the Week 2 README",
      description: "Understand what Express gives us over plain Node.",
      completed: true,
    },
    {
      id: 2,
      title: "Try every CRUD endpoint",
      description: "GET, POST, PUT, DELETE from the terminal with curl.",
      completed: false,
    },
  );
}
