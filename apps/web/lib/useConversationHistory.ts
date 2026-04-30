"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationData {
  conversationId: string;
  messages: ConversationMessage[];
}

async function fetchConversation(plantId: string): Promise<ConversationData> {
  const res = await api.get<ConversationData>(`/api/chat/conversation/${plantId}`);
  return res.data;
}

export function useConversationHistory(plantId: string | null | undefined) {
  return useQuery<ConversationData>({
    queryKey: ["conversation", plantId],
    queryFn: () => fetchConversation(plantId!),
    enabled: !!plantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}