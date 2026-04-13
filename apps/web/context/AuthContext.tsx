'use client';

import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import * as authApi from "@/lib/api/auth.api";
import type { CurrentUser } from '@/lib/types/auth';
import { GUEST_USER, isAuthenticated as checkIsAuthenticated } from '@/lib/types/auth';

export type AuthActionFailure = {
  ok: false;
  error?: string;
};

export type AuthSessionActionResult =
  | {
      ok: true;
      user: CurrentUser;
      nextStep: "home" | "setup-password";
    }
  | AuthActionFailure;

export type RegisterActionResult =
  | {
      ok: true;
      nextStep: "login";
    }
  | AuthActionFailure;

export type LogoutActionResult =
  | {
      ok: true;
      user: CurrentUser;
    }
  | AuthActionFailure;

interface AuthContextValue {
  user: CurrentUser;
  setUser: (user: CurrentUser) => void;
  resetUser: () => void;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthSessionActionResult>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<RegisterActionResult>;
  logout: () => Promise<LogoutActionResult>;
  refresh: () => Promise<AuthSessionActionResult>;
  setupPassword: (password: string) => Promise<AuthSessionActionResult>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: CurrentUser;
}


const AuthContext = createContext<AuthContextValue>({
  user: GUEST_USER,
  setUser: () => {},
  resetUser: () => {},
  isAuthReady: true,
  isAuthenticated: false,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: async () => ({ ok: false }),
  refresh: async () => ({ ok: false }),
  setupPassword: async () => ({ ok: false }),
});

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser>(initialUser);
  const [isAuthReady] = useState(true);

  const resolveNextStep = useCallback((currentUser: CurrentUser): "home" | "setup-password" => {
    return currentUser.requiresPasswordSetup ? "setup-password" : "home";
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    setUser(result.data);
    return {
      ok: true as const,
      user: result.data,
      nextStep: resolveNextStep(result.data),
    };
  }, [resolveNextStep]);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    const result = await authApi.register(data);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    return {
      ok: true as const,
      nextStep: result.data.nextStep,
    };
  }, []);

  const logout = useCallback(async () => {
    const result = await authApi.logout();
    setUser(GUEST_USER);

    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    return {
      ok: true as const,
      user: result.data,
    };
  }, []);

  const refresh = useCallback(async () => {
    const result = await authApi.refreshTokens();
    if (!result.ok) {
      setUser(GUEST_USER);
      return { ok: false as const, error: result.error };
    }

    setUser(result.data);
    return {
      ok: true as const,
      user: result.data,
      nextStep: resolveNextStep(result.data),
    };
  }, [resolveNextStep]);

  const setupPassword = useCallback(async (password: string) => {
    const result = await authApi.setupPassword(password);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    setUser(result.data);
    return {
      ok: true as const,
      user: result.data,
      nextStep: resolveNextStep(result.data),
    };
  }, [resolveNextStep]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      resetUser: () => setUser(GUEST_USER),
      isAuthReady,
      isAuthenticated: checkIsAuthenticated(user),
      login,
      register,
      logout,
      refresh,
      setupPassword,
    }),
    [user, isAuthReady, login, register, logout, refresh, setupPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
