"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isDemoUserLoggedIn, setDemoUserLoggedIn } from "./auth-client";

type AuthContextValue = {
  ready: boolean;
  loggedIn: boolean;
  login: () => void;
  logout: () => void;
  setLoggedIn: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedInState] = useState(false);

  useEffect(() => {
    setLoggedInState(isDemoUserLoggedIn());
    setReady(true);

    const handleStorage = () => {
      setLoggedInState(isDemoUserLoggedIn());
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setLoggedIn = (value: boolean) => {
    setDemoUserLoggedIn(value);
    setLoggedInState(value);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      loggedIn,
      login: () => setLoggedIn(true),
      logout: () => setLoggedIn(false),
      setLoggedIn,
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
