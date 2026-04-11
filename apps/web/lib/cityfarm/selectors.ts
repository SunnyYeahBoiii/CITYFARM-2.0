import { marketListings, feedPosts } from "./community";
import { homeStats, plants, reminders } from "./plants";
import { scanAnalysis, scanRecommendations } from "./scan";
import { dirtOptions, kits, potOptions, seeds } from "./shop";
import type { Plant, PlantTimelineStage } from "./types";

export function getPlants() {
  return plants;
}

export function getPlantById(plantId: string) {
  return plants.find((plant) => plant.id === plantId);
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

function offsetDate(dateString: string, offsetDays: number) {
  const baseDate = new Date(dateString);
  const result = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return result.toISOString().split("T")[0] ?? dateString;
}

export const cityFarmDataset = {
  plants,
  reminders,
  feedPosts,
  marketListings,
  scanRecommendations,
  scanAnalysis,
  seeds,
  dirtOptions,
  potOptions,
  kits,
  homeStats,
};
