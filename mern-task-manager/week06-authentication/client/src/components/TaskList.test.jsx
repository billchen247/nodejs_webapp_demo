/**
 * @file src/components/TaskList.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TaskList from "./TaskList.jsx";

describe("TaskList", () => {
  it("renders an empty state when there are no tasks", () => {
    render(
      <TaskList tasks={[]} onToggle={() => {}} onUpdate={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText(/no tasks here yet/i)).toBeInTheDocument();
  });

  it("renders each task", () => {
    // Week 6 tasks come from MongoDB, so they're keyed by `_id` rather
    // than the mock `id` used in earlier weeks.
    const tasks = [
      { _id: "1", title: "A", description: "", completed: false },
      { _id: "2", title: "B", description: "", completed: true },
    ];
    render(
      <TaskList
        tasks={tasks}
        onToggle={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
