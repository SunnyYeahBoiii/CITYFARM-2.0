import axios, { type AxiosRequestConfig } from "axios";
import { buildApiUrl } from "./config";
import { getApiErrorMessage } from "./error";

type ClientApiRequestOptions = Omit<AxiosRequestConfig, "url" | "baseURL">;

async function requestClientApi<T>(
  pathname: string,
  config: ClientApiRequestOptions,
): Promise<T> {
  try {
    const response = await axios.request<T>({
      ...config,
      url: buildApiUrl(pathname),
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Request failed for ${pathname}`));
  }
}

export async function adminClientGet<T>(pathname: string): Promise<T> {
  return requestClientApi<T>(pathname, {
    method: "GET",
  });
}

export async function adminClientPatch<T>(pathname: string, body: unknown): Promise<T> {
  return requestClientApi<T>(pathname, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
  });
}
