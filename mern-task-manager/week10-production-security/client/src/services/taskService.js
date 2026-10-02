/**
 * @file src/services/taskService.js
 * @author Bill Chen
 * @description Shared `request()` fetch wrapper (cookie-based auth, JSON
 *   handling, error normalization) plus the task CRUD API client.
 */
// Shared fetch wrapper. Week 6 adds:
//   - credentials: "include" so cookies travel with every request
//     (needed because the API is on a different origin)
//   - this base `request()` is now also used by authService

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (data && data.error) || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
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
