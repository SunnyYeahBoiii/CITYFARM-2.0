import { GardenPlantDetail } from "@/lib/types/garden";
import type { Plant, PlantTimelineStage } from "./types";

export function getHarvestDays(plant: GardenPlantDetail): number {
  const timeline = plant.plantSpecies.careProfile?.growthTimeline;
  const harvestDaysMin = plant.plantSpecies.harvestDaysMin ?? 60;
  
  if (timeline && (timeline as any[]).length > 0) {
    let cumulativeDays = 0;
    for (const s of timeline as any[]) {
      cumulativeDays += s.days || 0;
    }
    return Math.max(cumulativeDays, harvestDaysMin);
  }
  
  return harvestDaysMin;
}

export function buildTimelineFromApi(
  plant: GardenPlantDetail,
): PlantTimelineStage[] {
  const timeline = plant.plantSpecies.careProfile?.growthTimeline;
  const plantedAt = plant.plantedAt;
  const harvestDays = getHarvestDays(plant);
  const growingDays = daysSince(plantedAt);

  if (timeline && (timeline as any[]).length > 0) {
    const stageLabels: Record<string, string> = {
      seedling: "Seedling",
      vegetative: "Vegetative",
      harvest_window: "Harvest Window",
    };

    let currentDays = 0;
    const stages: PlantTimelineStage[] = [];

    let i = 0;
    for (const s of (timeline as any[])) {
      if (s.stage === "harvest_window") {
        currentDays += s.days || 0;
        continue;
      }

      let label = stageLabels[s.stage] ?? s.stage;
      if (s.stage === "vegetative") label = "Vegetative Growth";

      stages.push({
        day: currentDays,
        stage: i === 0 ? `Planted (${label})` : label,
        date: offsetDate(plantedAt, currentDays),
        completed: growingDays >= currentDays,
      });

      if (s.stage === "seedling" && s.days > 2) {
        const sproutingDay = Math.round(s.days * 0.3);
        stages.push({
          day: currentDays + sproutingDay,
          stage: "Sprouting",
          date: offsetDate(plantedAt, currentDays + sproutingDay),
          completed: growingDays >= currentDays + sproutingDay,
        });
      }

      currentDays += s.days;
      i++;
    }

    const finalDay = harvestDays;
    stages.push({
      day: finalDay,
      stage: "Harvest Ready",
      date: offsetDate(plantedAt, finalDay),
      completed: growingDays >= finalDay,
    });

    return stages;
  }

  return getTimelineForPlant({
    plantedDate: plantedAt,
    daysGrowing: growingDays,
    harvestDays,
  } as any);
}


export function getTimelineForPlant(plant: Plant): PlantTimelineStage[] {
  return [
    { day: 1, stage: "Planted", date: plant.plantedDate, completed: true },
    {
      day: 7,
      stage: "Sprouting",
      date: offsetDate(plant.plantedDate, 7),
      completed: plant.daysGrowing >= 7,
    },
    {
      day: 14,
      stage: "Vegetative Growth",
      date: offsetDate(plant.plantedDate, 14),
      completed: plant.daysGrowing >= 14,
    },
    {
      day: Math.floor(plant.harvestDays * 0.75),
      stage: "Flowering",
      date: offsetDate(plant.plantedDate, Math.floor(plant.harvestDays * 0.75)),
      completed: plant.daysGrowing >= Math.floor(plant.harvestDays * 0.75),
    },
    {
      day: plant.harvestDays,
      stage: "Harvest Ready",
      date: offsetDate(plant.plantedDate, plant.harvestDays),
      completed: plant.daysGrowing >= plant.harvestDays,
    },
  ];
}

export function daysSince(isoDate: string): number {
  return Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function offsetDate(dateString: string, offsetDays: number): string {
  const baseDate = new Date(dateString);
  const result = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return result.toISOString().split("T")[0] ?? dateString;
}
