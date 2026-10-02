/**
 * @file src/pages/Admin.jsx
 * @author Bill Chen
 * @description Admin-only page listing all registered users. The server
 *   is the real enforcement point; this page just renders the data.
 */
import { useEffect, useState } from "react";
import { userService } from "../services/userService.js";
import "./Admin.css";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await userService.list();
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="admin">
      <h2>Admin — all users</h2>
      <p className="admin__lede">
        Visible only to signed-in users whose <code>role</code> is{" "}
        <code>admin</code>. The server enforces this check.
      </p>

      {error ? (
        <div className="admin__error" role="alert">
          {error}
        </div>
      ) : loading ? (
        <p>Loading…</p>
      ) : users.length === 0 ? (
        <p>No users yet.</p>
      ) : (
        <table className="admin__table" aria-label="All users">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`admin__role admin__role--${u.role}`}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
