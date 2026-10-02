/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/tests/ProtectedRoute.test.tsx
 *
 * Focused tests for ProtectedRoute. We assemble a mini router with two
 * routes: a protected one and a login page that reports the `from`
 * location it received. That gives us a direct observation of the
 * "deep link survives the bounce to /login" behaviour.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

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

import ProtectedRoute from "../src/components/ProtectedRoute.js";
import { AuthProvider } from "../src/context/AuthContext.js";
import { api } from "../src/services/api.js";

function Secret() {
  return <div data-testid="secret">Secret</div>;
}

/** Reads `state.from.pathname` and renders it so we can assert on it. */
function LoginStub() {
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;
  return (
    <div>
      <h2>Log in</h2>
      <div data-testid="from">{state?.from?.pathname ?? ""}</div>
    </div>
  );
}

function renderAt(url: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Secret />
              </ProtectedRoute>
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

describe("ProtectedRoute", () => {
  it("renders the children when the user is signed in", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({
      user: { id: "1", email: "ada@example.com", name: "Ada", role: "user" as const },
    });
    renderAt("/tasks");
    expect(await screen.findByTestId("secret")).toBeInTheDocument();
  });

  it("redirects to /login and remembers where we were going", async () => {
    vi.mocked(api.auth.me).mockResolvedValue({ user: null });
    renderAt("/tasks");

    await waitFor(() => expect(screen.getByText(/log in/i)).toBeInTheDocument());
    expect(screen.getByTestId("from")).toHaveTextContent("/tasks");
    expect(screen.queryByTestId("secret")).not.toBeInTheDocument();
  });

  it("shows a loading status before /me resolves", async () => {
    // Deferred promise so we can observe the "checking session" state.
    let resolveMe!: (v: { user: null }) => void;
    vi.mocked(api.auth.me).mockReturnValueOnce(
      new Promise((r) => {
        resolveMe = r as (v: { user: null }) => void;
      }),
    );

    renderAt("/tasks");
    expect(screen.getByText(/checking session/i)).toBeInTheDocument();

    resolveMe({ user: null });
    await waitFor(() => expect(screen.getByText(/log in/i)).toBeInTheDocument());
  });
});
