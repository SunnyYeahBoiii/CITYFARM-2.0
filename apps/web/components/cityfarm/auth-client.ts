"use client";

/**
 * Demo-only client state.
 *
 * This flag is stored in localStorage and must not be used as real
 * authentication or authorization. It only controls demo UI state.
 * Real authentication must be enforced by the server/router using a
 * server-validated session such as an HTTP-only cookie.
 */
const DEMO_AUTH_KEY = "cityfarm-demo-user-logged-in";

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
