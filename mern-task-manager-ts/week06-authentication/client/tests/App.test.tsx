/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: client/tests/App.test.tsx
 *
 * Verifies App's auth routing:
 *   - Shows Login when `/me` returns null.
 *   - Shows Home when `/me` returns a user.
 *   - Logout returns the user to the Login form.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../src/services/api.js", () => ({
  api: {
    auth: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn(),
    },
    listTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(message: string, status: number, body: unknown) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
}));

import App from "../src/App.js";
import { api } from "../src/services/api.js";

beforeEach(() => {
  vi.mocked(api.auth.me).mockReset();
  vi.mocked(api.auth.logout).mockReset();
  vi.mocked(api.listTasks).mockReset().mockResolvedValue([]);
});

describe("App auth routing", () => {
  it("shows the login form when the user is not signed in", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({ user: null });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument(),
    );
  });

  it("shows Home when the user is signed in", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "1", email: "ada@example.com", name: "Ada" },
    });
    render(<App />);

    await waitFor(() => expect(screen.getByText(/signed in as/i)).toBeInTheDocument());
    expect(screen.getByText(/^Ada$/)).toBeInTheDocument();
    // The task page's "Add task" button renders only when Home is mounted.
    expect(await screen.findByRole("button", { name: /add task/i })).toBeInTheDocument();
  });

  it("logs the user out and returns to the login form", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "1", email: "ada@example.com", name: "Ada" },
    });
    vi.mocked(api.auth.logout).mockResolvedValue({ ok: true });
    const u = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText(/signed in as/i)).toBeInTheDocument());
    await u.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument(),
    );
    expect(api.auth.logout).toHaveBeenCalled();
  });
});
