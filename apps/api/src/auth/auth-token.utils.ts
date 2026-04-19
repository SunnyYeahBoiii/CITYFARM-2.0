import type { Request } from 'express';

const SESSION_TRANSPORT_BODY = 'body';

type RefreshTokenRequest = Request & {
  body?: {
    refreshToken?: unknown;
  };
};

function readHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return typeof value === 'string' ? value : '';
}

export function readCookie(req: Request, cookieName: string): string {
  const cookieValue: unknown = req.cookies?.[cookieName];
  return typeof cookieValue === 'string' ? cookieValue : '';
}

export function readBearerToken(req: Request): string {
  const authorization = readHeaderValue(req.headers.authorization);
  if (!authorization) {
    return '';
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return '';
  }

  return token;
}

export function readAccessToken(req: Request): string {
  return readBearerToken(req) || readCookie(req, 'access_token');
}

export function readRefreshToken(req: Request): string {
  const request = req as RefreshTokenRequest;
  const bodyRefreshToken = request.body?.refreshToken;
  if (typeof bodyRefreshToken === 'string' && bodyRefreshToken.length > 0) {
    return bodyRefreshToken;
  }

  return readBearerToken(req) || readCookie(req, 'refresh_token');
}

export function shouldExposeTokensInBody(req: Request): boolean {
  const sessionTransport = readHeaderValue(req.headers['x-session-transport']);
  const origin = readHeaderValue(req.headers.origin);

  return sessionTransport === SESSION_TRANSPORT_BODY && !origin;
}
