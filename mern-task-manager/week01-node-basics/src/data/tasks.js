/**
 * @file src/data/tasks.js
 * @author Bill Chen
 * @description In-memory task data for Week 1.
 *
 * There is no database yet — we just hold tasks in a JavaScript array that
 * lives in the Node.js process memory. If you restart the server, all data
 * goes back to this initial list. This is intentional: students should feel
 * the pain of volatility before we introduce MongoDB in Week 3.
 *
 * Teaching note: because this is a module-level `export const`, every file
 * that imports `tasks` shares the SAME array reference. Mutating it in one
 * place is visible everywhere — a nice first lesson in JavaScript module
 * singletons.
 */

export const tasks = [
  {
    id: 1,
    title: "Read the Week 1 README",
    description: "Understand what Node.js is and how to run a script.",
    completed: true,
  },
  {
    id: 2,
    title: "Install Node.js and npm",
    description: "Verify installation with `node -v` and `npm -v`.",
    completed: true,
  },
  {
    id: 3,
    title: "Run the Week 1 HTTP server",
    description: "Start the server and visit it in a browser or curl.",
    completed: false,
  },
];
