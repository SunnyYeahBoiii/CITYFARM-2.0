export function resolveRequiredUrl(name: string, devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`[config] Missing required env: ${name}`);
}
