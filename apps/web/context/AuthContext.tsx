'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as authApi from '@/lib/api/auth.api';
import type { CurrentUser } from '@/lib/types/auth';
import { GUEST_USER, isAuthenticated as checkIsAuthenticated } from '@/lib/types/auth';

interface AuthContextValue {
  user: CurrentUser;
  setUser: (user: CurrentUser) => void;
  resetUser: () => void;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setupPassword: (password: string) => Promise<boolean>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: CurrentUser;
}


const AuthContext = createContext<AuthContextValue>({
  user: GUEST_USER,
  setUser: () => {},
  resetUser: () => {},
  isAuthReady: false,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  refresh: async () => false,
  setupPassword: async () => false,
});

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser>(initialUser);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const syncProfile = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      setUser(GUEST_USER);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void syncProfile();
  }, [syncProfile]);

  const login = async (email: string, password: string) => {
    try {
      await authApi.login(email, password);
      await syncProfile();
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    try {
      await authApi.register(data);
      await syncProfile();
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(GUEST_USER);
    }
  };

  const refresh = async () => {
    try {
      await authApi.refreshTokens();
      await syncProfile();
      return true;
    } catch {
      return false;
    }
  };

  const setupPassword = async (password: string) => {
    try {
      await authApi.setupPassword(password);
      await syncProfile();
      return true;
    } catch {
      return false;
    }
  };

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
    [user, isAuthReady, syncProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
