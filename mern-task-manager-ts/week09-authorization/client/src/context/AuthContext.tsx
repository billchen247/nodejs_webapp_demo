/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/context/AuthContext.tsx
 *
 * AuthContext holds the single source of truth for "who is the current
 * user, if any". In Week 6 and 7 the App component held this state and
 * passed it down via callbacks. That worked, but every page that needed
 * to know about the user had to be threaded through props — and when we
 * add React Router in this week, pages can be mounted anywhere in the
 * tree. Context lets a page say `useAuth()` and get what it needs.
 *
 * Design choices worth noticing:
 *
 *   - The context exposes three *methods* — login, register, logout —
 *     instead of a raw `setUser`. That gives us one place to call the
 *     API, update state, and let React Router know about navigation.
 *     Components should not call `api.auth.*` directly any more.
 *
 *   - `loading` is a tri-state: `true` while we are checking `/me` on
 *     mount, `false` afterwards. ProtectedRoute uses this to render a
 *     spinner instead of flashing the login page for authenticated
 *     users.
 *
 *   - `useAuth()` throws if used outside the provider. That is a hard
 *     developer error, so a loud failure is kinder than a silent one.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api.js";
import type { AuthUser } from "../types.js";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // On first render, ask the server who we are. The server returns 200
  // with `user: null` for unauthenticated callers (see Week 6's /me
  // endpoint) — so we treat a network failure the same as "not logged in".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api.auth.me();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (input) => {
    const { user } = await api.auth.login(input);
    setUser(user);
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async (input) => {
    const { user } = await api.auth.register(input);
    setUser(user);
  }, []);

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    try {
      await api.auth.logout();
    } finally {
      // Clear local state even if the request failed — the cookie might
      // already have expired on the server side, in which case we are
      // already logged out as far as the API is concerned.
      setUser(null);
    }
  }, []);

  // Memoise so consumers that only use one field don't re-render when
  // an unrelated field changes identity on every render.
  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the current auth state and actions. Throws outside AuthProvider. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return value;
}
