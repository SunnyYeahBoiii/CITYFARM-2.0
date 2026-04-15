import type { Request } from 'express';
import {
  readAccessToken,
  readRefreshToken,
  shouldExposeTokensInBody,
} from './auth-token.utils';

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as Request;
}

describe('auth-token utils', () => {
  it('prefers bearer access tokens over access token cookies', () => {
    const request = createRequest({
      headers: {
        authorization: 'Bearer bearer-access-token',
      },
      cookies: {
        access_token: 'cookie-access-token',
      },
    });

    expect(readAccessToken(request)).toBe('bearer-access-token');
  });

  it('reads refresh tokens from the request body before cookies', () => {
    const request = createRequest({
      body: {
        refreshToken: 'body-refresh-token',
      },
      cookies: {
        refresh_token: 'cookie-refresh-token',
      },
    });

    expect(readRefreshToken(request)).toBe('body-refresh-token');
  });

  it('only exposes session tokens in body for explicit non-browser requests', () => {
    const mobileRequest = createRequest({
      headers: {
        'x-session-transport': 'body',
      },
    });
    const browserRequest = createRequest({
      headers: {
        'x-session-transport': 'body',
        origin: 'https://cityfarm.example',
      },
    });

    expect(shouldExposeTokensInBody(mobileRequest)).toBe(true);
    expect(shouldExposeTokensInBody(browserRequest)).toBe(false);
  });
});
