'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile } from '@/lib/api/auth.api';
import type { CurrentUser } from '@/lib/types/auth';
import { GUEST_USER } from '@/lib/types/auth';

interface AuthContextValue {
  user: CurrentUser;
  setUser: (user: CurrentUser) => void;
  resetUser: () => void;
  isAuthReady: boolean;
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
});

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser>(initialUser);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch {
        setUser(GUEST_USER);
      } finally {
        setIsAuthReady(true);
      }
    };

    void syncProfile();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      resetUser: () => setUser(GUEST_USER),
      isAuthReady,
    }),
    [user, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
