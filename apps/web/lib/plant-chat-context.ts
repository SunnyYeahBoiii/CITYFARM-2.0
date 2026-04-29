import type { Plant, PlantHealth } from "./cityfarm-data";
import { api } from "./client";

export type ChatContextPayload = {
  name: string;
  type: string;
  health: string;
  daysGrowing: number;
  note: string;
};

export type EnhancedPlantContext = {
  species: {
    commonName: string;
    scientificName: string;
    difficulty: string;
    lightRequirement: string;
    careGuide: string | null;
    wateringGuide: string | null;
    pestsGuide: unknown | null;
  };
  currentPlant: {
    nickname: string | null;
    status: string;
    health: string;
    growthStage: string;
    daysGrowing: number;
    zoneName: string | null;
    notes: string | null;
  };
  recentJournals: Array<{
    id: string;
    date: string;
    health: string | null;
    issue: string | null;
    recommendation: string | null;
    note: string | null;
    aiAnalysis: unknown | null;
    leafColor: string | null;
  }>;
  pendingTasks: Array<{
    id: string;
    type: string;
    title: string;
    due: string | null;
    notes: string | null;
  }>;
};

function healthLabel(health: PlantHealth): string {
  switch (health) {
    case "healthy":
      return "Khỏe mạnh";
    case "warning":
      return "Cần chú ý";
    case "critical":
      return "Nguy kịch";
    default:
      return "Không rõ";
  }
}

export function plantToChatContext(plant: Plant): ChatContextPayload {
  return {
    name: plant.name,
    type: plant.type,
    health: healthLabel(plant.health),
    daysGrowing: plant.daysGrowing,
    note: plant.note || "Không có ghi chú",
  };
}

export async function fetchEnhancedPlantContext(plantId: string): Promise<EnhancedPlantContext | null> {
  try {
    const res = await api.get<EnhancedPlantContext>(`/api/chat/plants/${plantId}/context`);
    return res.data;
  } catch {
    console.error("Failed to fetch enhanced plant context for", plantId);
    return null;
  }
}

export function formatEnhancedContextForPrompt(context: EnhancedPlantContext): string {
  const parts: string[] = [];

  parts.push(`Cây: ${context.currentPlant.nickname ?? "Không tên"} (${context.species.commonName})`);
  parts.push(`Sức khỏe: ${context.currentPlant.health} | Giai đoạn: ${context.currentPlant.growthStage}`);
  parts.push(`Số ngày trồng: ${context.currentPlant.daysGrowing}`);

  if (context.species.careGuide) {
    parts.push(`\nHướng dẫn chăm sóc: ${context.species.careGuide}`);
  }

  if (context.species.wateringGuide) {
    parts.push(`Hướng dẫn tưới: ${context.species.wateringGuide}`);
  }

  if (context.recentJournals.length > 0) {
    parts.push(`\nNhật ký gần đây:`);
    for (const j of context.recentJournals) {
      const dateStr = new Date(j.date).toLocaleDateString("vi-VN");
      parts.push(`- ${dateStr}: Sức khỏe=${j.health ?? "?"}, Vấn đề=${j.issue ?? "Không"}, Ghi chú=${j.note ?? ""}`);
    }
  }

  if (context.pendingTasks.length > 0) {
    parts.push(`\nCông việc đang chờ:`);
    for (const t of context.pendingTasks) {
      const dueStr = t.due ? new Date(t.due).toLocaleDateString("vi-VN") : "Không có ngày";
      parts.push(`- ${t.type}: ${t.title} (đến hạn: ${dueStr})`);
    }
  }

  return parts.join("\n");
}