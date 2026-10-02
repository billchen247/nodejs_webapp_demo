/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/tests/Admin.test.tsx
 *
 * Tests for the admin dashboard page. We mock the api service so each
 * test can set up exactly the user list it needs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { AuthUser } from "../src/types.js";

vi.mock("../src/services/api.js", () => ({
  api: {
    auth: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn().mockResolvedValue({
        user: { id: "me", email: "admin@example.com", name: "Me", role: "admin" },
      }),
    },
    listTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    admin: {
      listUsers: vi.fn(),
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

import Admin from "../src/pages/Admin.js";
import { AuthProvider } from "../src/context/AuthContext.js";
import { api, ApiError } from "../src/services/api.js";

const seedUsers: AuthUser[] = [
  { id: "me", email: "admin@example.com", name: "Me", role: "admin" },
  { id: "u1", email: "ada@example.com", name: "Ada", role: "user" },
  { id: "u2", email: "bob@example.com", name: "", role: "user" },
];

function renderAdmin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/admin"]}>
        <Admin />
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.admin.listUsers).mockReset().mockResolvedValue([...seedUsers]);
  vi.mocked(api.admin.updateRole).mockReset();
});

describe("Admin page", () => {
  it("renders every user with their role", async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText("ada@example.com")).toBeInTheDocument());
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("role-u1")).toHaveTextContent(/user/i);
    expect(screen.getByTestId("role-me")).toHaveTextContent(/admin/i);
  });

  it("disables the action button for the currently signed-in admin", async () => {
    renderAdmin();
    await waitFor(() => expect(screen.getByText("ada@example.com")).toBeInTheDocument());
    const row = screen.getByTestId("user-row-me");
    const button = row.querySelector("button") as HTMLButtonElement;
    expect(button).toBeDisabled();
  });

  it("promotes a user and updates the row in place", async () => {
    vi.mocked(api.admin.updateRole).mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      name: "Ada",
      role: "admin",
    });

    const u = userEvent.setup();
    renderAdmin();
    await waitFor(() => expect(screen.getByText("ada@example.com")).toBeInTheDocument());
    await u.click(screen.getByRole("button", { name: /promote ada@example\.com/i }));

    await waitFor(() =>
      expect(api.admin.updateRole).toHaveBeenCalledWith("u1", "admin"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("role-u1")).toHaveTextContent(/admin/i),
    );
  });

  it("surfaces a server error", async () => {
    vi.mocked(api.admin.listUsers).mockRejectedValueOnce(
      new ApiError("Forbidden", 403, null),
    );
    renderAdmin();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/forbidden/i),
    );
  });

  it("shows an empty state when there are no users", async () => {
    vi.mocked(api.admin.listUsers).mockResolvedValueOnce([]);
    renderAdmin();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/no users yet/i),
    );
  });
});
