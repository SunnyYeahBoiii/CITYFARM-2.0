const DEFAULT_API_BASE_URL = "http://localhost:3001";
const DEFAULT_NEST_API_BASE_URL = "http://127.0.0.1:3001";

function normalizeBaseUrl(rawValue: string | undefined): string {
  const baseUrl = rawValue?.trim() || DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/+$/, "");
}

const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
const NEST_API_BASE_URL = normalizeBaseUrl(process.env.NEST_API_URL ?? DEFAULT_NEST_API_BASE_URL);

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getNestApiBaseUrl(): string {
  return NEST_API_BASE_URL;
}

export function buildApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function buildNestApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${NEST_API_BASE_URL}${normalizedPath}`;
}

export function getGoogleAuthUrl(): string {
  return buildApiUrl("/auth/google");
}
