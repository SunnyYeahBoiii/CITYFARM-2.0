import { resolveAllowedOrigins } from './url-config';

describe('resolveAllowedOrigins', () => {
  it('throws in production when WEB_ORIGINS is missing', () => {
    expect(() => resolveAllowedOrigins('production', undefined)).toThrow(
      '[config] Missing required env: WEB_ORIGINS',
    );
  });

  it('uses localhost defaults in development when WEB_ORIGINS is missing', () => {
    const origins = resolveAllowedOrigins('development', undefined);
    expect(origins.has('http://localhost:3000')).toBe(true);
    expect(origins.has('http://127.0.0.1:3000')).toBe(true);
    expect(origins.has('http://localhost:3002')).toBe(true);
    expect(origins.has('http://127.0.0.1:3002')).toBe(true);
  });

  it('trims and parses comma-separated WEB_ORIGINS values', () => {
    const origins = resolveAllowedOrigins(
      'production',
      ' https://app.example.com/ , https://admin.example.com ',
    );
    expect(origins.has('https://app.example.com/')).toBe(true);
    expect(origins.has('https://admin.example.com')).toBe(true);
  });
});
