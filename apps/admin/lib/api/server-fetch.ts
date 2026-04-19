import axios, { AxiosHeaders, type AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import { buildApiUrl } from "./config";
import { readApiMessage, getApiErrorMessage } from "./error";

type ServerApiFetchOptions = Omit<AxiosRequestConfig, "url" | "baseURL"> & {
  headers?: AxiosRequestConfig["headers"];
};

export async function readSessionCookies() {
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

export type AdminServerResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  message?: string;
};

export async function adminServerFetch(
  pathname: string,
  options: ServerApiFetchOptions = {},
): Promise<AdminServerResponse<unknown>> {
  const { headers: inputHeaders, validateStatus, ...config } = options;
  const headers = AxiosHeaders.from(
    inputHeaders as ConstructorParameters<typeof AxiosHeaders>[0],
  );

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

  try {
    const response = await axios.request({
      ...config,
      url: buildApiUrl(pathname),
      method: config.method ?? "GET",
      headers,
      withCredentials: true,
      validateStatus: validateStatus ?? (() => true),
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data ?? null,
      message: readApiMessage(response.data),
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Failed to fetch ${pathname}`));
  }
}
