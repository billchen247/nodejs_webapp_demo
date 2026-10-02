/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/pages/Admin.tsx
 *
 * The admin dashboard — a tiny user management page.
 *
 * This page is reachable only via the `/admin` route, which is wrapped
 * in `<RequireRole role="admin">`. If somebody discovers the URL and
 * types it directly, the client will redirect them. But crucially, if
 * they also hand-craft a request to `/api/users`, the *server* will
 * refuse. The React UI is a convenience, not a security boundary.
 *
 * Shows:
 *   - Every registered user (newest first)
 *   - Their current role
 *   - A button to promote/demote (except for the admin themselves)
 */
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.js";
import type { AuthUser, UserRole } from "../types.js";
import "./Admin.css";

function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.admin.listUsers();
      setUsers(list);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleToggleRole(u: AuthUser): Promise<void> {
    const next: UserRole = u.role === "admin" ? "user" : "admin";
    try {
      const updated = await api.admin.updateRole(u.id, next);
      // Replace the row in-place rather than refetching the whole list.
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setError(describeError(err));
    }
  }

  return (
    <section className="admin">
      <header className="admin__header">
        <h2 className="admin__title">Admin dashboard</h2>
        <p className="admin__subtitle">
          Promote or demote users. You cannot demote yourself.
        </p>
      </header>

      {error && (
        <div className="admin__error" role="alert">
          <strong>Something went wrong:</strong> {error}
        </div>
      )}

      {loading ? (
        <p role="status" className="admin__loading">
          Loading users…
        </p>
      ) : users.length === 0 ? (
        <p role="status" className="admin__empty">
          No users yet.
        </p>
      ) : (
        <table className="admin__table" aria-label="Users">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col" className="admin__actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              return (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td>{u.email}</td>
                  <td>{u.name || "—"}</td>
                  <td>
                    <span
                      className={`admin__role admin__role--${u.role}`}
                      data-testid={`role-${u.id}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="admin__actions-col">
                    <button
                      type="button"
                      className="admin__action"
                      onClick={() => void handleToggleRole(u)}
                      disabled={isSelf}
                      aria-label={
                        u.role === "admin"
                          ? `Demote ${u.email} to user`
                          : `Promote ${u.email} to admin`
                      }
                    >
                      {u.role === "admin" ? "Demote to user" : "Promote to admin"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
