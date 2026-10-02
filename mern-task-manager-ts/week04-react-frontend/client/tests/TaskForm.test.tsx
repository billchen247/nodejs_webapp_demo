/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 04
 * File: client/tests/TaskForm.test.tsx
 *
 * Tests focus on *observable user behaviour*, not internal state:
 *   - Can a user type a title and submit?
 *   - Does an empty title show an error?
 *   - Does the form clear after a successful submit?
 *
 * We never reach into component internals. If a test needs the DOM
 * screen-reader label, it means the UI is probably accessible — nice bonus.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskForm from "../src/components/TaskForm.js";

describe("TaskForm", () => {
  it("calls onAdd with trimmed values when a title is submitted", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onAdd={onAdd} />);
    await user.type(screen.getByLabelText(/title/i), "  Walk the dog  ");
    await user.type(screen.getByLabelText(/description/i), "Twice a day");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("Walk the dog", "Twice a day");
  });

  it("shows an error and does not call onAdd when title is empty", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(onAdd).not.toHaveBeenCalled();
    // The error is announced to assistive tech — look it up by role instead
    // of by class, which is more robust and more accessible.
    expect(screen.getByRole("alert")).toHaveTextContent(/empty/i);
  });

  it("clears the fields after a successful submit", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onAdd={onAdd} />);
    const title = screen.getByLabelText(/title/i) as HTMLInputElement;

    await user.type(title, "A task");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(title.value).toBe("");
  });

  it("clears the error on next valid submit", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onAdd={onAdd} />);
    // First: empty submit → error visible.
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Then: provide a title and submit → error should vanish.
    await user.type(screen.getByLabelText(/title/i), "Now valid");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
