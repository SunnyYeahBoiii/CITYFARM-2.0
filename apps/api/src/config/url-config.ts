const DEFAULT_WEB_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
];

export function resolveAllowedOrigins(
  nodeEnv: string | undefined,
  webOrigins: string | undefined,
): Set<string> {
  const isProduction = nodeEnv === 'production';
  const envOrigins =
    webOrigins
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  if (isProduction && envOrigins.length === 0) {
    throw new Error('[config] Missing required env: WEB_ORIGINS');
  }

  return new Set(
    isProduction ? envOrigins : [...DEFAULT_WEB_ORIGINS, ...envOrigins],
  );
}
