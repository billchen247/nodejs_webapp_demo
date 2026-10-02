/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: client/tests/Home.test.tsx
 *
 * Integration-ish tests for the Home page now that it talks to the API.
 *
 * Strategy: mock the `api` module. The alternative — stubbing `fetch`
 * globally — would also work, but mocking the service layer keeps these
 * tests focused on React behaviour. Low-level fetch wiring is covered
 * separately in `tests/api.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Task } from "../src/types.js";

// Hoisted mock so the module is intercepted *before* Home imports it.
vi.mock("../src/services/api.js", () => {
  return {
    api: {
      listTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    },
    ApiError: class ApiError extends Error {
      status: number;
      body: unknown;
      constructor(message: string, status: number, body: unknown) {
        super(message);
        this.status = status;
        this.body = body;
      }
    },
  };
});

// Import Home *after* the mock is in place.
import Home from "../src/pages/Home.js";
import { api } from "../src/services/api.js";

const seed: Task[] = [
  { id: "1", title: "Write docs", description: "readme + weekly notes", completed: false },
  { id: "2", title: "Review PRs", description: "", completed: true },
];

beforeEach(() => {
  vi.mocked(api.listTasks).mockReset().mockResolvedValue([...seed]);
  vi.mocked(api.createTask).mockReset();
  vi.mocked(api.updateTask).mockReset();
  vi.mocked(api.deleteTask).mockReset();
});

describe("Home page (wired to API)", () => {
  it("shows a loading indicator, then renders tasks from the server", async () => {
    render(<Home />);

    // The initial loading state is a visible status element.
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);

    await waitFor(() => expect(screen.getByText("Write docs")).toBeInTheDocument());
    expect(screen.getByText("Review PRs")).toBeInTheDocument();
    expect(api.listTasks).toHaveBeenCalledTimes(1);
  });

  it("creates a task through the API when the form is submitted", async () => {
    const created: Task = {
      id: "3",
      title: "New thing",
      description: "",
      completed: false,
    };
    vi.mocked(api.createTask).mockResolvedValue(created);

    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByText("Write docs")).toBeInTheDocument());

    await user.type(screen.getByLabelText(/title/i), "New thing");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith({ title: "New thing", description: "" }),
    );
    expect(screen.getByText("New thing")).toBeInTheDocument();
  });

  it("toggles a task's completed flag through the API", async () => {
    vi.mocked(api.updateTask).mockImplementation(async (id, patch) => ({
      ...(seed.find((t) => t.id === id) as Task),
      ...patch,
    }));

    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByText("Write docs")).toBeInTheDocument());

    const row = screen.getByTestId("task-1");
    await user.click(within(row).getByRole("checkbox"));

    await waitFor(() => expect(api.updateTask).toHaveBeenCalledWith("1", { completed: true }));
  });

  it("deletes a task through the API and removes it from the list", async () => {
    vi.mocked(api.deleteTask).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByText("Write docs")).toBeInTheDocument());

    const row = screen.getByTestId("task-1");
    await user.click(within(row).getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(api.deleteTask).toHaveBeenCalledWith("1"));
    expect(screen.queryByText("Write docs")).not.toBeInTheDocument();
  });

  it("surfaces an API error with a retry button", async () => {
    vi.mocked(api.listTasks).mockRejectedValueOnce(new Error("Network down"));
    vi.mocked(api.listTasks).mockResolvedValueOnce([...seed]);

    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/network down/i),
    );

    await user.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("Write docs")).toBeInTheDocument());
    expect(api.listTasks).toHaveBeenCalledTimes(2);
  });

  it("filters tasks based on the active filter button", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByText("Write docs")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /^active$/i }));
    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.queryByText("Review PRs")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^completed$/i }));
    expect(screen.getByText("Review PRs")).toBeInTheDocument();
    expect(screen.queryByText("Write docs")).not.toBeInTheDocument();
  });
});
