# Mobile Auth Client

This API supports two session transports:

- Web: httpOnly cookies, used by the Next.js app.
- Mobile/native: bearer access tokens plus a refresh token stored in secure
  storage.

## Server contract

Use `X-Session-Transport: body` on these requests from native clients:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/setup-password`

When the request is made without a browser `Origin` header, the API responds
with:

```json
{
  "message": "Logged in successfully",
  "access_token": "<jwt>",
  "refresh_token": "<jwt>"
}
```

Authenticated requests should send:

```http
Authorization: Bearer <access_token>
```

When the API returns `401`, call:

```http
POST /auth/refresh
X-Session-Transport: body
Content-Type: application/json

{ "refreshToken": "<refresh_token>" }
```

## Axios example

```ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type TokenStore = {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: SessionTokens): Promise<void>;
  clear(): Promise<void>;
};

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

export function createMobileApiClient(
  baseURL: string,
  tokenStore: TokenStore,
): AxiosInstance {
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let isRefreshing = false;
  let queue: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];

  const flushQueue = (error?: unknown) => {
    queue.forEach((entry) => {
      if (error) {
        entry.reject(error);
        return;
      }

      entry.resolve();
    });
    queue = [];
  };

  api.interceptors.request.use(async (config) => {
    const accessToken = await tokenStore.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  const refreshTokens = async (): Promise<void> => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Missing refresh token');
    }

    const { data } = await axios.post<SessionTokens>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Transport': 'body',
        },
      },
    );

    await tokenStore.setTokens(data);
  };

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryConfig | undefined;
      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        throw error;
      }

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        refreshTokens()
          .then(() => flushQueue())
          .catch(async (refreshError) => {
            await tokenStore.clear();
            flushQueue(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      return new Promise((resolve, reject) => {
        queue.push({
          resolve: async () => {
            const accessToken = await tokenStore.getAccessToken();
            if (accessToken) {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${accessToken}`,
              };
            }

            resolve(api(originalRequest));
          },
          reject,
        });
      });
    },
  );

  return api;
}
```

## Login example

```ts
const { data } = await axios.post<SessionTokens>(
  `${API_URL}/auth/login`,
  { email, password },
  {
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Transport': 'body',
    },
  },
);

await tokenStore.setTokens(data);
```

Store `refresh_token` in secure native storage such as Keychain, Keystore, or
Expo SecureStore instead of plain AsyncStorage when possible.
