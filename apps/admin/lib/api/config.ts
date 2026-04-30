const DEFAULT_API_BASE_URL = "http://localhost:3001";
const DEFAULT_WEB_BASE_URL = "http://localhost:3000";

function resolveRequiredBaseUrl(name: string, devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`[config] Missing required env: ${name}`);
}

const API_BASE_URL = resolveRequiredBaseUrl("NEXT_PUBLIC_API_URL", DEFAULT_API_BASE_URL);
const WEB_BASE_URL = resolveRequiredBaseUrl("NEXT_PUBLIC_WEB_URL", DEFAULT_WEB_BASE_URL);

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getWebBaseUrl(): string {
  return WEB_BASE_URL;
}

export function buildApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
