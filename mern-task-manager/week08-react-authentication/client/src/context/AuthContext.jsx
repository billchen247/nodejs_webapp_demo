/**
 * @file src/context/AuthContext.jsx
 * @author Bill Chen
 * @description AuthContext — a single source of truth for "who is signed in".
 *
 * Why a context? In Week 7 we passed `user` and callbacks down through
 * props. That works for small trees but gets noisy fast. React Context
 * lets any descendant read from or act on the auth state without
 * prop drilling.
 *
 * NOTE: we still store NOTHING sensitive in JavaScript memory. The JWT
 * lives in the HTTP-only cookie. This context only tracks the derived
 * user profile.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService.js";

// Exported (in addition to the `useAuth` hook below) so tests can wrap
// components in `<AuthContext.Provider value={...}>` with a stub value
// instead of exercising the real `AuthProvider` + network calls.
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // bootstrapping on mount

  // On startup, ask the server if we're already authenticated.
  const refreshUser = useCallback(async () => {
    try {
      const { user } = await authService.me();
      setUser(user);
      return user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const { user } = await authService.login(credentials);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (input) => {
    const { user } = await authService.register(input);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A friendly hook with a nice error if used outside the provider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
