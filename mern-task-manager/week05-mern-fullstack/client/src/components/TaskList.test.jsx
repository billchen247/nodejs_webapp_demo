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
