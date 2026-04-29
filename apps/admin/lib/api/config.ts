const DEFAULT_API_BASE_URL = "http://localhost:3001";
const DEFAULT_WEB_BASE_URL = "http://localhost:3000";

function normalizeBaseUrl(rawValue: string | undefined, fallback: string): string {
  const baseUrl = rawValue?.trim() || fallback;
  return baseUrl.replace(/\/+$/, "");
}

const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL, DEFAULT_API_BASE_URL);
const WEB_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_WEB_URL, DEFAULT_WEB_BASE_URL);

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
