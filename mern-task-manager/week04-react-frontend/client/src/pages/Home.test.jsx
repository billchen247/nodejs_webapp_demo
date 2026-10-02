/**
 * @file src/pages/Home.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home, { newId } from "./Home.jsx";

describe("Home page", () => {
  it("renders the initial mock tasks", () => {
    render(<Home />);
    expect(screen.getByText(/learn jsx/i)).toBeInTheDocument();
    expect(screen.getByText(/understand usestate/i)).toBeInTheDocument();
  });

  it("adds a new task through the form", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.type(screen.getByLabelText(/title/i), "fresh task");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByText("fresh task")).toBeInTheDocument();
  });

  it("filters to active and completed", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: /completed/i }));
    expect(screen.getByText(/learn jsx/i)).toBeInTheDocument();
    expect(screen.queryByText(/understand usestate/i)).toBeNull();
  });
});

describe("newId", () => {
  it("returns a unique string", () => {
    const a = newId();
    const b = newId();
    expect(typeof a).toBe("string");
    expect(a).not.toEqual(b);
  });
});
