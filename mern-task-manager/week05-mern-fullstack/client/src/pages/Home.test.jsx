/**
 * @file src/pages/Home.test.jsx
 * @author Bill Chen
 * @description Week 5's Home page fetches tasks from the API through
 *   `taskService`. Rather than stubbing `fetch` directly, we mock the
 *   service module — it keeps these tests focused on component behavior
 *   instead of network/fetch plumbing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./Home.jsx";
import { taskService } from "../services/taskService.js";

vi.mock("../services/taskService.js", () => ({
  taskService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const sampleTasks = [
  { _id: "1", title: "Learn JSX", description: "", completed: true },
  { _id: "2", title: "Understand useState", description: "", completed: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  taskService.list.mockResolvedValue(sampleTasks);
});

describe("Home page", () => {
  it("loads and renders tasks from the API", async () => {
    render(<Home />);
    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    expect(await screen.findByText("Learn JSX")).toBeInTheDocument();
    expect(screen.getByText("Understand useState")).toBeInTheDocument();
  });

  it("adds a new task through the form", async () => {
    const user = userEvent.setup();
    const created = {
      _id: "3",
      title: "fresh task",
      description: "",
      completed: false,
    };
    taskService.create.mockResolvedValue(created);

    render(<Home />);
    await screen.findByText("Learn JSX");

    await user.type(screen.getByLabelText(/title/i), "fresh task");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByText("fresh task")).toBeInTheDocument();
    expect(taskService.create).toHaveBeenCalledWith({
      title: "fresh task",
      description: "",
    });
  });

  it("filters to active and completed", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText("Learn JSX");

    await user.click(screen.getByRole("tab", { name: /completed/i }));
    expect(screen.getByText(/learn jsx/i)).toBeInTheDocument();
    expect(screen.queryByText(/understand usestate/i)).toBeNull();
  });

  it("shows an error message when loading fails", async () => {
    taskService.list.mockRejectedValue(new Error("network down"));
    render(<Home />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/network down/i);
  });
});
