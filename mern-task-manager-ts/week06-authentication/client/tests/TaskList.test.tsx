/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: client/tests/TaskList.test.tsx
 *
 * Behaviour-focused tests for TaskList + TaskItem working together.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskList from "../src/components/TaskList.js";
import type { Task } from "../src/types.js";

const sampleTasks: Task[] = [
  { id: "a", title: "First", description: "", completed: false },
  { id: "b", title: "Second", description: "with details", completed: true },
];

describe("TaskList", () => {
  it("renders every task", () => {
    render(<TaskList tasks={sampleTasks} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("renders an empty state when there are no tasks", () => {
    render(<TaskList tasks={[]} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no tasks here yet/i);
  });

  it("marks completed tasks visually (strike-through container)", () => {
    render(<TaskList tasks={sampleTasks} onToggle={() => {}} onDelete={() => {}} />);
    const secondRow = screen.getByTestId("task-b");
    expect(secondRow.className).toContain("task-item--done");
  });

  it("fires onToggle with the right id when a checkbox is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<TaskList tasks={sampleTasks} onToggle={onToggle} onDelete={() => {}} />);
    const firstRow = screen.getByTestId("task-a");
    await user.click(within(firstRow).getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("a");
  });

  it("fires onDelete with the right id when Delete is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<TaskList tasks={sampleTasks} onToggle={() => {}} onDelete={onDelete} />);
    const secondRow = screen.getByTestId("task-b");
    await user.click(within(secondRow).getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("b");
  });
});
