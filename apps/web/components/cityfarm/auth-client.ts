"use client";

const AUTH_KEY = "cityfarm-auth";

export function isUserLoggedIn() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTH_KEY) === "1";
}

export function setUserLoggedIn(loggedIn: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (loggedIn) {
    window.localStorage.setItem(AUTH_KEY, "1");
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
}
