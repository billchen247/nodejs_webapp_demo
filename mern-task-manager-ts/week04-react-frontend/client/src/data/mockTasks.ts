/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 04
 * File: client/src/data/mockTasks.ts
 *
 * Mock seed data for the UI.
 *
 * Week 4 does NOT talk to the backend yet — the whole point is to focus
 * on React, props, state, and CSS without any network concerns.
 * In Week 5 we will swap this file for a real `fetch` service.
 */
import type { Task } from "../types.js";

export const mockTasks: Task[] = [
  {
    id: "m1",
    title: "Welcome to the MERN Task Manager",
    description: "This UI is driven entirely by React state this week.",
    completed: true,
  },
  {
    id: "m2",
    title: "Add a new task below",
    description: "The form will append it to the list.",
    completed: false,
  },
  {
    id: "m3",
    title: "Mark something complete",
    description: "Click the checkbox and the row style changes.",
    completed: false,
  },
];
