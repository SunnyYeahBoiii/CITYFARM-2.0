import type { Plant, PlantHealth } from "./cityfarm-data";

export type ChatContextPayload = {
  name: string;
  type: string;
  health: string;
  daysGrowing: number;
  note: string;
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
