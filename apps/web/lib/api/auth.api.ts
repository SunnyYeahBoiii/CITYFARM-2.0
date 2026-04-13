import { AxiosError } from "axios";
import { api } from "../client";
import type { CurrentUser } from "../types/auth";
import { GUEST_USER } from "../types/auth";
import { mapRawProfileToCurrentUser, type RawProfileResponse } from "./auth-profile";

type AuthApiFailure = {
  ok: false;
  error?: string;
};

type AuthApiSuccess<T> = {
  ok: true;
  data: T;
};

export type LoginResult = AuthApiSuccess<CurrentUser> | AuthApiFailure;
export type RegisterResult = AuthApiSuccess<{ nextStep: "login" }> | AuthApiFailure;
export type LogoutResult = AuthApiSuccess<CurrentUser> | AuthApiFailure;
export type RefreshResult = AuthApiSuccess<CurrentUser> | AuthApiFailure;
export type SetupPasswordResult = AuthApiSuccess<CurrentUser> | AuthApiFailure;

function getApiErrorMessage(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data as { message?: string } | undefined;
    return responseMessage?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}

export async function getProfile(): Promise<CurrentUser> {
  try {
    const { data } = await api.get<RawProfileResponse>("/auth/profile");
    return mapRawProfileToCurrentUser(data);
  } catch {
    return GUEST_USER;
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    await api.post("/auth/login", { email, password });
    const user = await getProfile();
    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: getApiErrorMessage(error) };
  }
}

/**
 * Register new account
 * @param displayName - Display name (required)
 * @param bio - Bio (optional)
 * @param city - City (optional)
 * @param district - District (optional)
 * @param ward - Ward (optional)
 */
export async function register(data: {
  email: string;
  password: string;
  displayName: string;
  bio?: string;
  city?: string;
  district?: string;
  ward?: string;
}): Promise<RegisterResult> {
  try {
    await api.post("/auth/register", data);
    return { ok: true, data: { nextStep: "login" } };
  } catch (error) {
    return { ok: false, error: getApiErrorMessage(error) };
  }
}

export async function logout(): Promise<LogoutResult> {
  try {
    await api.post("/auth/logout");
    return { ok: true, data: GUEST_USER };
  } catch (error) {
    return { ok: false, error: getApiErrorMessage(error) };
  }
}

export async function refreshTokens(): Promise<RefreshResult> {
  try {
    await api.post("/auth/refresh");
    const user = await getProfile();
    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: getApiErrorMessage(error) };
  }
}

export async function setupPassword(password: string): Promise<SetupPasswordResult> {
  try {
    await api.post("/auth/setup-password", { password });
    const user = await getProfile();
    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: getApiErrorMessage(error) };
  }
}
