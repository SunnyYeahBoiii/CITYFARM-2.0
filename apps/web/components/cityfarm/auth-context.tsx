"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuthSession, loginWithCredentials, logoutSession, registerWithCredentials } from "./auth-client";

type AuthContextValue = {
  ready: boolean;
  loggedIn: boolean;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedInState] = useState(false);

  const refreshSession = async () => {
    const authenticated = await getAuthSession();
    setLoggedInState(authenticated);
    return authenticated;
  };

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      try {
        const authenticated = await getAuthSession();
        if (active) {
          setLoggedInState(authenticated);
        }
      } catch {
        if (active) {
          setLoggedInState(false);
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    void hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    const authenticated = await loginWithCredentials(payload);
    setLoggedInState(authenticated);
    return authenticated;
  };

  const register = async (payload: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    const authenticated = await registerWithCredentials(payload);
    setLoggedInState(authenticated);
    return authenticated;
  };

  const logout = async () => {
    await logoutSession();
    setLoggedInState(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      loggedIn,
      login,
      register,
      logout,
      refreshSession,
    }),
    [ready, loggedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
