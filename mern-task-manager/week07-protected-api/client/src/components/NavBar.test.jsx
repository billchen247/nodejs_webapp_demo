/**
 * @file src/components/NavBar.test.jsx
 * @author Bill Chen
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavBar from "./NavBar.jsx";

describe("NavBar", () => {
  it("shows login/signup links when logged out", () => {
    render(
      <NavBar user={null} view="home" onNavigate={() => {}} onLogout={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows the user's name and a log out button when logged in", () => {
    render(
      <NavBar
        user={{ name: "Ada", email: "ada@example.com" }}
        view="home"
        onNavigate={() => {}}
        onLogout={() => {}}
      />,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log in/i })).toBeNull();
  });

  it("calls onNavigate when a nav link is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <NavBar user={null} view="home" onNavigate={onNavigate} onLogout={() => {}} />,
    );
    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(onNavigate).toHaveBeenCalledWith("login");
  });

  it("calls onLogout when log out is clicked", async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();
    render(
      <NavBar
        user={{ name: "Ada", email: "ada@example.com" }}
        view="home"
        onNavigate={() => {}}
        onLogout={onLogout}
      />,
    );
    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
