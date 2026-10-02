/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/tests/RequireRole.test.tsx
 *
 * Behaviour tests for the <RequireRole> guard.
 *
 * We assemble a tiny router: a /login stub, a protected /admin, and a
 * public /tasks landing page. Each test seeds the mocked /me response
 * so the AuthProvider thinks of us as nobody, a user, or an admin.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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
    admin: {
      listUsers: vi.fn().mockResolvedValue([]),
      updateRole: vi.fn(),
    },
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

import RequireRole from "../src/components/RequireRole.js";
import { AuthProvider } from "../src/context/AuthContext.js";
import { api } from "../src/services/api.js";

function Secret() {
  return <div data-testid="secret">Admin area</div>;
}

function LoginStub() {
  return <h2>Log in</h2>;
}

function renderAt(url: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <Secret />
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.auth.me).mockReset();
});

describe("<RequireRole role=\"admin\">", () => {
  it("redirects unauthenticated users to /login", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({ user: null });
    renderAt("/admin");
    await waitFor(() => expect(screen.getByText(/log in/i)).toBeInTheDocument());
    expect(screen.queryByTestId("secret")).not.toBeInTheDocument();
  });

  it("shows a forbidden page to a non-admin user", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "1", email: "ada@example.com", name: "Ada", role: "user" },
    });
    renderAt("/admin");
    expect(await screen.findByTestId("forbidden")).toBeInTheDocument();
    expect(screen.queryByTestId("secret")).not.toBeInTheDocument();
  });

  it("renders the children for an admin", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "2", email: "admin@example.com", name: "Admin", role: "admin" },
    });
    renderAt("/admin");
    expect(await screen.findByTestId("secret")).toBeInTheDocument();
    expect(screen.queryByTestId("forbidden")).not.toBeInTheDocument();
  });
});
