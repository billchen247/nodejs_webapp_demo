/**
 * @file src/components/TaskItem.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskItem from "./TaskItem.jsx";

const baseTask = {
  _id: "1",
  title: "Task A",
  description: "Something to do",
  completed: false,
};

describe("TaskItem", () => {
  it("renders title and description", () => {
    render(
      <TaskItem
        task={baseTask}
        onToggle={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Something to do")).toBeInTheDocument();
  });

  it("calls onToggle when the checkbox is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskItem
        task={baseTask}
        onToggle={onToggle}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("enters edit mode and saves changes", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskItem
        task={baseTask}
        onToggle={() => {}}
        onUpdate={onUpdate}
        onDelete={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    const titleInput = screen.getByLabelText(/edit title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated");
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onUpdate).toHaveBeenCalledWith("1", {
      title: "Updated",
      description: "Something to do",
    });
  });

  it("cancel resets drafts without calling onUpdate", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskItem
        task={baseTask}
        onToggle={() => {}}
        onUpdate={onUpdate}
        onDelete={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(screen.getByLabelText(/edit title/i));
    await user.type(screen.getByLabelText(/edit title/i), "something else");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("Task A")).toBeInTheDocument();
  });

  it("delete button calls onDelete", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskItem
        task={baseTask}
        onToggle={() => {}}
        onUpdate={() => {}}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
