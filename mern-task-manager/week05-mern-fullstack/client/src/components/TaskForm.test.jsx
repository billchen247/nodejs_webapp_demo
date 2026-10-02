/**
 * @file src/components/TaskForm.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskForm from "./TaskForm.jsx";

describe("TaskForm", () => {
  it("renders the heading and inputs", () => {
    render(<TaskForm onSubmit={() => {}} />);
    expect(screen.getByRole("heading", { name: /new task/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("shows a validation error when title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/title is required/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed values and clears inputs", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/title/i), "  write tests  ");
    await user.type(screen.getByLabelText(/description/i), "  with vitest  ");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "write tests",
      description: "with vitest",
    });
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
  });
});
