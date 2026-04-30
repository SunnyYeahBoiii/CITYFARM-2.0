import { internalApi } from "./client";
import type { ChatContextPayload } from "./plant-chat-context";

export type { ChatContextPayload } from "./plant-chat-context";

export type ChatRequestBody = {
  message: string;
  plantId?: string;
  context?: ChatContextPayload;
};

export type ToolCallData = {
  id: string;
  name: string;
  arguments: {
    plantId?: string;
    taskType?: string;
    title?: string;
    dueAt?: string;
    notes?: string;
    note?: string;
    healthStatus?: string;
    issueSummary?: string;
  };
  result?: unknown;
  success?: boolean;
  error?: string;
};

export type ChatApiResponse = {
  success: boolean;
  reply?: string;
  error?: string;
  details?: string;
  conversationId?: string;
  toolCalls?: ToolCallData[];
};

/** Cùng origin → Route Next proxy → chỉ NestJS (`NEST_API_URL`). */
export async function postChat(body: ChatRequestBody): Promise<ChatApiResponse> {
  const { data } = await internalApi.post<ChatApiResponse>("/api/chat", body);
  return data;
}

/** Create a care task for a plant. */
export async function createCareTask(
  plantId: string,
  body: {
    taskType: string;
    title: string;
    dueAt?: string;
    notes?: string;
  },
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data } = await internalApi.post<{
    success: boolean;
    id?: string;
    error?: string;
  }>(`/api/garden/plants/${plantId}/tasks`, body);
  return data;
}
