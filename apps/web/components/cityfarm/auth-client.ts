"use client";

const DEMO_AUTH_KEY = "cityfarm-demo-user-logged-in";
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "demo";
const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_BASE ?? "";

type SessionResponse = {
  authenticated: boolean;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

function authUrl(path: string) {
  return `${AUTH_API_BASE}${path}`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(authUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Auth request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function isDemoUserLoggedIn() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DEMO_AUTH_KEY) === "1";
}

export function setDemoUserLoggedIn(loggedIn: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (loggedIn) {
    window.localStorage.setItem(DEMO_AUTH_KEY, "1");
    return;
  }

  window.localStorage.removeItem(DEMO_AUTH_KEY);
}

export async function getAuthSession(): Promise<boolean> {
  if (AUTH_MODE === "api") {
    const payload = await apiRequest<SessionResponse>("/auth/session", { method: "GET" });
    return payload.authenticated;
  }

  return isDemoUserLoggedIn();
}

export async function loginWithCredentials(payload: LoginPayload): Promise<boolean> {
  if (AUTH_MODE === "api") {
    const result = await apiRequest<SessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result.authenticated;
  }

  setDemoUserLoggedIn(true);
  return true;
}

export async function registerWithCredentials(payload: RegisterPayload): Promise<boolean> {
  if (AUTH_MODE === "api") {
    const result = await apiRequest<SessionResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result.authenticated;
  }

  setDemoUserLoggedIn(true);
  return true;
}

export async function logoutSession(): Promise<void> {
  if (AUTH_MODE === "api") {
    await apiRequest<void>("/auth/logout", { method: "POST" });
    return;
  }

  setDemoUserLoggedIn(false);
}

/**
 * @deprecated Demo-only compatibility wrapper. This does not provide real authentication.
 * Use `isDemoUserLoggedIn` instead.
 */
export function isUserLoggedIn() {
  return isDemoUserLoggedIn();
}

/**
 * @deprecated Demo-only compatibility wrapper. This does not provide real authentication.
 * Use `setDemoUserLoggedIn` instead.
 */
export function setUserLoggedIn(loggedIn: boolean) {
  setDemoUserLoggedIn(loggedIn);
}
