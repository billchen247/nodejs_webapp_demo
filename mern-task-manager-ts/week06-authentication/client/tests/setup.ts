/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: client/tests/setup.ts
 *
 * Vitest setup for the React test suite.
 *
 * - Imports jest-dom matchers (e.g. `toBeInTheDocument`) so our assertions
 *   read naturally.
 * - Registers an afterEach cleanup so each test starts with an empty DOM.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
