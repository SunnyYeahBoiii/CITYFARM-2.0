function readEnv(name: string): string | undefined {
  switch (name) {
    case "NEXT_PUBLIC_APP_URL":
      return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_WEB_URL;
    case "NEXT_PUBLIC_WEB_URL":
      return process.env.NEXT_PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    case "NEXT_PUBLIC_API_URL":
      return process.env.NEXT_PUBLIC_API_URL;
    case "NEST_API_URL":
      return typeof window === "undefined" ? process.env.NEST_API_URL : undefined;
    default:
      return undefined;
  }
}

export function resolveRequiredUrl(name: string, devFallback: string): string {
  const trimmed = readEnv(name)?.trim();
  if (trimmed) return trimmed.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`[config] Missing required env: ${name}`);
}
