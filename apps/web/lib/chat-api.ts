import { internalApi } from "./client";
import type { ChatContextPayload } from "./plant-chat-context";

export type { ChatContextPayload } from "./plant-chat-context";

export type ChatRequestBody = {
  message: string;
  plantId?: string;
  context?: ChatContextPayload;
};

export type ChatApiResponse = {
  success: boolean;
  reply?: string;
  error?: string;
  details?: string;
};

/** Cùng origin → Route Next proxy → chỉ NestJS (`NEST_API_URL`). */
export async function postChat(body: ChatRequestBody): Promise<ChatApiResponse> {
  const { data } = await internalApi.post<ChatApiResponse>("/api/chat", body);
  return data;
}
