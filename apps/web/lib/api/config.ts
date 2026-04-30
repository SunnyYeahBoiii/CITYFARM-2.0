const DEFAULT_API_BASE_URL = "http://localhost:3001";

function resolveRequiredBaseUrl(name: string, devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`[config] Missing required env: ${name}`);
}

const API_BASE_URL = resolveRequiredBaseUrl("NEXT_PUBLIC_API_URL", DEFAULT_API_BASE_URL);
const NEST_API_BASE_URL = resolveRequiredBaseUrl("NEST_API_URL", DEFAULT_API_BASE_URL);

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
