import axios from "axios";
import type { ChatContextPayload } from "./plant-chat-context";

export type { ChatContextPayload } from "./plant-chat-context";

export type ChatRequestBody = {
  message: string;
  context?: ChatContextPayload;
};

export type ChatApiResponse = {
  success: boolean;
  reply?: string;
  error?: string;
  details?: string;
};

const chatClient = axios.create({
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

export async function postChat(body: ChatRequestBody): Promise<ChatApiResponse> {
  const { data } = await chatClient.post<ChatApiResponse>("/api/chat", body);
  return data;
}
