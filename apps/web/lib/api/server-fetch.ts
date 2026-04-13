import { cookies } from "next/headers";
import { buildApiUrl } from "./config";

type ServerApiFetchOptions = Omit<RequestInit, "headers" | "cache"> & {
  headers?: HeadersInit;
  cache?: RequestCache;
};

export type SessionCookies = {
  accessToken?: string;
  refreshToken?: string;
};

export async function readSessionCookies(): Promise<SessionCookies> {
  try {
    const cookieStore = await cookies();
    return {
      accessToken: cookieStore.get("access_token")?.value,
      refreshToken: cookieStore.get("refresh_token")?.value,
    };
  } catch {
    return {};
  }
}

export async function serverApiFetch(
  pathname: string,
  options: ServerApiFetchOptions = {},
): Promise<Response> {
  const {
    headers: inputHeaders,
    cache = "no-store",
    ...init
  } = options;

  const headers = new Headers(inputHeaders);
  if (!headers.has("Cookie")) {
    const sessionCookies = await readSessionCookies();
    const cookieHeader = [
      sessionCookies.accessToken ? `access_token=${sessionCookies.accessToken}` : null,
      sessionCookies.refreshToken ? `refresh_token=${sessionCookies.refreshToken}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }
  }

  return fetch(buildApiUrl(pathname), {
    ...init,
    cache,
    headers: headers.keys().next().done ? undefined : headers,
  });
}
