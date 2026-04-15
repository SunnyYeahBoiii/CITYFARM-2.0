import axios from "axios";

type ApiErrorPayload = {
  message?: string | string[];
};

function normalizeMessage(message: string | string[] | undefined): string | undefined {
  if (Array.isArray(message)) {
    const joined = message.join(", ").trim();
    return joined || undefined;
  }

  if (typeof message === "string") {
    const trimmed = message.trim();
    return trimmed || undefined;
  }

  return undefined;
}

export function readApiMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return normalizeMessage((payload as ApiErrorPayload).message);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return (
      readApiMessage(error.response?.data) ??
      error.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
