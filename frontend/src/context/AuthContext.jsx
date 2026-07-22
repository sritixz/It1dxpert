// AuthContext — single source of truth for "who's logged in and as what
// role". Tokens live in localStorage (simple for this phase; swap for
// httpOnly cookies later if that's preferred — see note in README) and
// user info is cached alongside so a page refresh doesn't need a network
// round-trip just to know which sidebar to render.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginRequest, registerPatientRequest, fetchCurrentUser } from "../api/auth.api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // On mount, if a token exists but we're not fully sure it's still valid
  // (e.g. role changed server-side since last login), re-fetch /auth/me.
  // Falls back to clearing auth state if the token turns out to be dead —
  // the apiClient's 401 handling covers the refresh attempt already.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      })
      .catch(() => {
        clearAuthStorage();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { accessToken, refreshToken, user: loggedInUser } = await loginRequest({ email, password });
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const registerPatient = useCallback(async (payload) => {
    const { accessToken, refreshToken, user: newUser } = await registerPatientRequest(payload);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerPatient, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
