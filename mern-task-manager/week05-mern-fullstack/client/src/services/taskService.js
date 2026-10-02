/**
 * @file src/services/taskService.js
 * @author Bill Chen
 * @description This service module is a thin wrapper around `fetch` for
 *   our task API. Keeping all network code in one place means:
 *   - components stay small and declarative
 *   - we have a single place to add things like loading, errors, or auth
 *     later on (we'll do this in Week 6+)
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // No content on 204; otherwise try to parse JSON.
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (data && data.error) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export const taskService = {
  list() {
    return request("/api/tasks");
  },
  get(id) {
    return request(`/api/tasks/${id}`);
  },
  create(input) {
    return request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(id, input) {
    return request(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  remove(id) {
    return request(`/api/tasks/${id}`, { method: "DELETE" });
  },
};
