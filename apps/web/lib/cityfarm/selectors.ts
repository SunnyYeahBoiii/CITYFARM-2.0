import { marketListings, feedPosts } from "./community";
import { homeStats, plants, reminders } from "./plants";
import { scanAnalysis, scanRecommendations } from "./scan";
import { dirtOptions, kits, potOptions, seeds } from "./shop";
export * from "./utils";

export function getPlants() {
  return plants;
}

export function getPlantById(plantId: string) {
  return plants.find((plant) => plant.id === plantId);
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
