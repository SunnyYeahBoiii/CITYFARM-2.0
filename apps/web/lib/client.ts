import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "./api/config";

export const API_URL = getApiBaseUrl();

function createJsonClient({
  baseURL,
  timeout,
}: {
  baseURL?: string;
  timeout?: number;
} = {}): AxiosInstance {
  return axios.create({
    baseURL,
    timeout,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const api: AxiosInstance = createJsonClient({
  baseURL: API_URL,
});

export const internalApi: AxiosInstance = createJsonClient({
  timeout: 120_000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

const isPublicRoute = (pathname: string): boolean => {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/setup-password" ||
    pathname === "/" ||
    pathname.startsWith("/plants")
  );
};

const shouldAttemptRefresh = (config?: AxiosRequestConfig): boolean => {
  if (!config?.url) return false;
  return !config.url.includes("/auth/refresh");
};

const refresh = async (): Promise<void> => {
  try {
    await api.post("/auth/refresh");
  } catch {
    throw new Error("Token refresh failed");
  }
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptRefresh(originalRequest)
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        void refresh()
          .then(() => processQueue(null))
          .catch((err) => processQueue(err as Error))
          .finally(() => {
            isRefreshing = false;
          });
      }

      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject: (err) => reject(err || error),
        });
      });
    }

    if (typeof window !== "undefined" && status === 401) {
      const pathname = window.location.pathname;
      if (!isPublicRoute(pathname)) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export { api };
