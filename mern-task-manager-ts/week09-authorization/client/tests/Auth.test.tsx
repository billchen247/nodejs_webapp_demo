/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/tests/Auth.test.tsx
 *
 * Tests for the Login and Register pages after the Week 8 rewrite.
 * They no longer take props — they call `useAuth()` and use the
 * router — so we render them inside a <MemoryRouter> plus a lightweight
 * <AuthProvider>-with-mocked-api wrapper.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../src/services/api.js", () => ({
  api: {
    auth: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn().mockResolvedValue({ user: null }),
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

import Login from "../src/pages/Login.js";
import Register from "../src/pages/Register.js";
import { AuthProvider } from "../src/context/AuthContext.js";
import { api, ApiError } from "../src/services/api.js";

beforeEach(() => {
  vi.mocked(api.auth.me).mockReset().mockResolvedValue({ user: null });
  vi.mocked(api.auth.login).mockReset();
  vi.mocked(api.auth.register).mockReset();
});

/**
 * Renders the component at /login (or /register) inside a provider +
 * router. The route table includes a stub /tasks page so we can assert
 * that a successful submit navigates there.
 */
function renderWithProviders(initial: string, element: JSX.Element) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={element} />
          <Route path="/register" element={element} />
          <Route path="/tasks" element={<div data-testid="tasks-page">Tasks page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Login page", () => {
  it("submits the form, calls the API, and navigates to /tasks", async () => {
    const user = { id: "1", email: "ada@example.com", name: "Ada", role: "user" as const };
    vi.mocked(api.auth.login).mockResolvedValue({ user });
    const u = userEvent.setup();

    renderWithProviders("/login", <Login />);
    await u.type(screen.getByLabelText(/email/i), "ada@example.com");
    await u.type(screen.getByLabelText(/password/i), "correct horse");
    await u.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(screen.getByTestId("tasks-page")).toBeInTheDocument());
    expect(api.auth.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct horse",
    });
  });

  it("shows the server-supplied error message on failure", async () => {
    vi.mocked(api.auth.login).mockRejectedValue(
      new ApiError("Invalid email or password", 401, null),
    );
    const u = userEvent.setup();

    renderWithProviders("/login", <Login />);
    await u.type(screen.getByLabelText(/email/i), "x@y.com");
    await u.type(screen.getByLabelText(/password/i), "wrong");
    await u.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i),
    );
    expect(screen.queryByTestId("tasks-page")).not.toBeInTheDocument();
  });

  it("renders a link to the register page", () => {
    renderWithProviders("/login", <Login />);
    const link = screen.getByRole("link", { name: /register/i });
    expect(link).toHaveAttribute("href", "/register");
  });
});

describe("Register page", () => {
  it("submits, calls the API, and navigates to /tasks", async () => {
    const user = { id: "2", email: "new@example.com", name: "", role: "user" as const };
    vi.mocked(api.auth.register).mockResolvedValue({ user });
    const u = userEvent.setup();

    renderWithProviders("/register", <Register />);
    await u.type(screen.getByLabelText(/email/i), "new@example.com");
    await u.type(screen.getByLabelText(/^password$/i), "longenough");
    await u.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByTestId("tasks-page")).toBeInTheDocument());
    expect(api.auth.register).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "longenough",
      name: undefined,
    });
  });

  it("rejects a short password without calling the API", async () => {
    const u = userEvent.setup();
    renderWithProviders("/register", <Register />);
    await u.type(screen.getByLabelText(/email/i), "a@b.com");
    await u.type(screen.getByLabelText(/^password$/i), "short");
    await u.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8/i);
    expect(api.auth.register).not.toHaveBeenCalled();
  });

  it("surfaces a 409 conflict from the server", async () => {
    vi.mocked(api.auth.register).mockRejectedValue(
      new ApiError("Email is already registered", 409, null),
    );
    const u = userEvent.setup();

    renderWithProviders("/register", <Register />);
    await u.type(screen.getByLabelText(/email/i), "taken@example.com");
    await u.type(screen.getByLabelText(/^password$/i), "longenough");
    await u.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already registered/i),
    );
  });

  it("renders a link back to the login page", () => {
    renderWithProviders("/register", <Register />);
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
