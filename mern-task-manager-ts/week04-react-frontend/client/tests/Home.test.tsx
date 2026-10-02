/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 04
 * File: client/tests/Home.test.tsx
 *
 * Integration-ish tests that mount the whole Home page.
 *
 * These prove the pieces (TaskForm + TaskList + filter buttons) work
 * together — the kind of test the Testing Library docs lovingly call
 * "testing the way the user uses the app".
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../src/pages/Home.js";

describe("Home page", () => {
  it("adds a task through the form and shows it in the list", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText(/title/i), "Learn React");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    // The newest task is rendered first.
    expect(screen.getByText("Learn React")).toBeInTheDocument();
  });

  it("filters to active tasks only", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // The mock seed has one completed task ("Welcome to the MERN Task Manager").
    await user.click(screen.getByRole("button", { name: /active/i }));
    expect(screen.queryByText(/Welcome to the MERN Task Manager/i)).not.toBeInTheDocument();
  });

  it("filters to completed tasks only", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /^completed$/i }));
    expect(screen.getByText(/Welcome to the MERN Task Manager/i)).toBeInTheDocument();
    expect(screen.queryByText(/Add a new task below/i)).not.toBeInTheDocument();
  });

  it("deletes a task", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const row = screen.getByText(/Add a new task below/i).closest("li");
    expect(row).not.toBeNull();
    await user.click(within(row!).getByRole("button", { name: /delete/i }));

    expect(screen.queryByText(/Add a new task below/i)).not.toBeInTheDocument();
  });

  it("toggles completed state", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const row = screen.getByText(/Add a new task below/i).closest("li");
    expect(row).not.toBeNull();
    await user.click(within(row!).getByRole("checkbox"));

    // The row picks up the "done" modifier.
    expect(row!.className).toContain("task-item--done");
  });
});
