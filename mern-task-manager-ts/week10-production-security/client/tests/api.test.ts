/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/tests/api.test.ts
 *
 * Unit tests for the API service layer.
 *
 * We stub the global `fetch` to assert *exactly* what the frontend
 * sends over the wire. These tests are fast and give early warning
 * if someone changes the request shape by mistake.
 *
 * Why not use msw (Mock Service Worker)?
 *   msw is excellent, but adds a dependency and a bit of ceremony.
 *   For this teaching project a plain fetch stub is clearer: students
 *   can see exactly what is being pretended.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../src/services/api.js";

function makeResponse(body: unknown, init: { status?: number; ok?: boolean } = {}): Response {
  const status = init.status ?? 200;
  const text = body === undefined ? "" : JSON.stringify(body);
  // The Response constructor is available in jsdom.
  return new Response(text, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  // vi.stubGlobal makes the override discoverable and auto-reversible.
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api service", () => {
  it("listTasks sends a GET and returns the JSON array", async () => {
    fetchMock.mockResolvedValue(makeResponse([{ id: "1", title: "x", description: "", completed: false }]));

    const result = await api.listTasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/tasks");
    expect(init?.method ?? "GET").toBe("GET");
    // Every request must opt in to credentialed cookies.
    expect(init?.credentials).toBe("include");
    expect(result).toEqual([{ id: "1", title: "x", description: "", completed: false }]);
  });

  it("auth.register POSTs email and password and returns the user", async () => {
    const user = { id: "u1", email: "a@b.com", name: "", role: "user" as const };
    fetchMock.mockResolvedValue(makeResponse({ user }, { status: 201 }));

    const result = await api.auth.register({ email: "a@b.com", password: "abcdefgh" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/register");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      email: "a@b.com",
      password: "abcdefgh",
    });
    expect(result).toEqual({ user });
  });

  it("auth.login POSTs email and password", async () => {
    const user = { id: "u1", email: "a@b.com", name: "", role: "user" as const };
    fetchMock.mockResolvedValue(makeResponse({ user }));

    await api.auth.login({ email: "a@b.com", password: "abcdefgh" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/login");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
  });

  it("auth.logout POSTs", async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true }));
    await api.auth.logout();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/logout");
    expect(init?.method).toBe("POST");
  });

  it("auth.me GETs and returns the current user", async () => {
    const user = { id: "u1", email: "a@b.com", name: "", role: "user" as const };
    fetchMock.mockResolvedValue(makeResponse({ user }));

    const result = await api.auth.me();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/me");
    expect(result.user).toEqual(user);
  });

  it("createTask POSTs a JSON body", async () => {
    const created = { id: "9", title: "Hi", description: "", completed: false };
    fetchMock.mockResolvedValue(makeResponse(created, { status: 201 }));

    const result = await api.createTask({ title: "Hi", description: "" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ title: "Hi", description: "" });
    expect(result).toEqual(created);
  });

  it("updateTask PUTs a JSON patch and targets the right id", async () => {
    const updated = { id: "9", title: "Hi", description: "", completed: true };
    fetchMock.mockResolvedValue(makeResponse(updated));

    const result = await api.updateTask("9", { completed: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/tasks/9");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(init?.body as string)).toEqual({ completed: true });
    expect(result).toEqual(updated);
  });

  it("deleteTask returns undefined for a 204 response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await api.deleteTask("9");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/tasks/9");
    expect(init?.method).toBe("DELETE");
    expect(result).toBeUndefined();
  });

  it("throws ApiError with the server-supplied message on 400+", async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ error: "Title is required" }, { status: 400 }),
    );

    await expect(api.createTask({ title: "" })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Title is required",
    });
  });

  it("wraps non-JSON error bodies in an ApiError", async () => {
    fetchMock.mockResolvedValue(new Response("plain text failure", { status: 500 }));

    const err = await api.listTasks().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });

  it("auth.forgotPassword POSTs the email and returns the dev token when present", async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true, devToken: "abcdef" }));

    const result = await api.auth.forgotPassword({ email: "a@b.com" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/forgot-password");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ email: "a@b.com" });
    expect(result.devToken).toBe("abcdef");
  });

  it("auth.resetPassword POSTs the token and the new password", async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true }));

    await api.auth.resetPassword({ token: "tok", newPassword: "longenough" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/reset-password");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      token: "tok",
      newPassword: "longenough",
    });
  });

  describe("auto-refresh on 401", () => {
    it("transparently retries task calls after a successful refresh", async () => {
      // 1st call to /api/tasks -> 401
      // 2nd call (refresh)     -> 200
      // 3rd call to /api/tasks -> 200 (retry)
      fetchMock
        .mockResolvedValueOnce(makeResponse({ error: "unauthorized" }, { status: 401 }))
        .mockResolvedValueOnce(makeResponse({ user: { id: "u1" } }))
        .mockResolvedValueOnce(makeResponse([{ id: "1", title: "ok", description: "", completed: false }]));

      const result = await api.listTasks();

      expect(fetchMock).toHaveBeenCalledTimes(3);
      const refreshUrl = fetchMock.mock.calls[1][0] as string;
      expect(refreshUrl).toContain("/api/auth/refresh");
      expect(result).toEqual([{ id: "1", title: "ok", description: "", completed: false }]);
    });

    it("does not retry /me — a 401 there means 'not logged in' and should surface", async () => {
      // The whole point of /me is to find out if we're logged in. Looping
      // through /refresh on its 401 would mask the signal and could end
      // in an infinite loop.
      fetchMock.mockResolvedValueOnce(makeResponse({ error: "unauthorized" }, { status: 401 }));

      await expect(api.auth.me()).rejects.toMatchObject({ status: 401 });
      // Only the one /me call — no /refresh follow-up.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("gives up when the refresh itself fails", async () => {
      fetchMock
        .mockResolvedValueOnce(makeResponse({ error: "unauthorized" }, { status: 401 }))
        .mockResolvedValueOnce(makeResponse({ error: "nope" }, { status: 401 }));

      await expect(api.listTasks()).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
