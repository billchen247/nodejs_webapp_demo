/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/tests/App.test.tsx
 *
 * Integration-ish tests for the top-level routing. The real App mounts
 * BrowserRouter inside main.tsx, but we need per-test control over the
 * initial URL — so we render App inside a <MemoryRouter> here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../src/services/api.js", () => ({
  api: {
    auth: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue({ ok: true }),
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

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(api.auth.me).mockReset();
  vi.mocked(api.auth.logout).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(api.listTasks).mockReset().mockResolvedValue([]);
});

describe("App routing", () => {
  it("sends an unauthenticated visitor from /tasks to /login", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({ user: null });
    renderAt("/tasks");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument(),
    );
  });

  it("renders Home when an authenticated user visits /tasks", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "1", email: "ada@example.com", name: "Ada", role: "user" as const },
    });
    renderAt("/tasks");

    expect(await screen.findByRole("button", { name: /add task/i })).toBeInTheDocument();
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByText(/^Ada$/)).toBeInTheDocument();
  });

  it("redirects / to /tasks (and then to /login if unauthenticated)", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({ user: null });
    renderAt("/");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument(),
    );
  });

  it("logs the user out and returns to the login form", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "1", email: "ada@example.com", name: "Ada", role: "user" as const },
    });
    const u = userEvent.setup();
    renderAt("/tasks");

    await waitFor(() => expect(screen.getByText(/signed in as/i)).toBeInTheDocument());
    await u.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument(),
    );
    expect(api.auth.logout).toHaveBeenCalled();
  });
});
