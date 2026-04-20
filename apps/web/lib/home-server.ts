import "server-only";

import type { PlantHealth } from "@/lib/cityfarm/types";
import { serverApiFetch } from "@/lib/api/server-fetch";
import type { FeedPost, MarketListing } from "@/lib/types/community";
import type { GardenPlantSummary, GardenStats } from "@/lib/types/garden";
import type { Kit } from "@/lib/types/shop";

type HomeTaskIcon = "water" | "sun" | "check";
type HomeStatTone = "green" | "blue" | "amber";

export interface HomeTaskCard {
  id: string;
  gardenPlantId: string;
  plantName: string;
  action: string;
  timeLabel: string;
  icon: HomeTaskIcon;
}

export interface HomePlantCard {
  id: string;
  name: string;
  subtitle: string;
  health: PlantHealth;
  imageUrl: string;
  progress: number;
  taskLabel: string;
}

export interface HomeStatCard {
  label: string;
  value: string;
  tone: HomeStatTone;
}

export interface HomeMarketTeaser {
  id: string;
  title: string;
  sellerName: string;
  district: string;
  quantity: string;
  price: string;
  imageUrl?: string;
  createdLabel: string;
}

export interface HomePostTeaser {
  id: string;
  author: string;
  district: string;
  caption: string;
  imageUrl?: string;
  engagement: string;
  createdLabel: string;
}

export interface HomeStarterKit {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  description?: string;
}

export interface HomeData {
  careTasks: HomeTaskCard[];
  plants: HomePlantCard[];
  stats: HomeStatCard[];
  marketListings: HomeMarketTeaser[];
  latestPost?: HomePostTeaser;
  starterKits: HomeStarterKit[];
}

function normalizeCollection<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: T[] }).data;
  }

  return [];
}

async function serverGetCollection<T>(pathname: string): Promise<T[] | undefined> {
  try {
    const response = await serverApiFetch(pathname);
    if (!response.ok) {
      return undefined;
    }

    const payload = (await response.json()) as unknown;
    return normalizeCollection<T>(payload);
  } catch (error) {
    console.error(`[home-server] failed to load ${pathname}:`, error);
    return undefined;
  }
}

async function serverGetValue<T>(pathname: string): Promise<T | undefined> {
  try {
    const response = await serverApiFetch(pathname);
    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`[home-server] failed to load ${pathname}:`, error);
    return undefined;
  }
}

function fallbackPlantImage(category: string): string {
  const normalized = category.toLowerCase();

  if (normalized.includes("herb")) {
    return "/cityfarm/img/mint.png";
  }

  if (normalized.includes("onion") || normalized.includes("allium")) {
    return "/cityfarm/img/onion.png";
  }

  if (normalized.includes("leaf") || normalized.includes("green") || normalized.includes("lettuce")) {
    return "/cityfarm/img/lettuce.png";
  }

  return "/cityfarm/img/tomato.png";
}

function diffInDays(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(isoDate));
}

function formatRelativeDay(isoDate: string): string {
  const target = new Date(isoDate);
  const dayDiff = Math.round((startOfDay(target) - startOfDay(new Date())) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) {
    return `Overdue · ${formatTime(isoDate)}`;
  }

  if (dayDiff === 0) {
    return `Today · ${formatTime(isoDate)}`;
  }

  if (dayDiff === 1) {
    return `Tomorrow · ${formatTime(isoDate)}`;
  }

  return `${formatShortDate(isoDate)} · ${formatTime(isoDate)}`;
}

function formatFeedDate(isoDate: string): string {
  const target = new Date(isoDate).getTime();
  const hoursAgo = Math.max(0, Math.floor((Date.now() - target) / (1000 * 60 * 60)));

  if (hoursAgo < 1) {
    return "Just now";
  }

  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) {
    return `${daysAgo}d ago`;
  }

  return formatShortDate(isoDate);
}

function formatPrice(priceAmount: number): string {
  return `${priceAmount.toLocaleString("vi-VN")}₫`;
}

function toPlantHealth(status: GardenPlantSummary["healthStatus"]): PlantHealth {
  switch (status) {
    case "HEALTHY":
      return "healthy";
    case "CRITICAL":
      return "critical";
    case "WARNING":
    case "UNKNOWN":
    default:
      return "warning";
  }
}

function taskIcon(taskType: string): HomeTaskIcon {
  if (taskType === "WATERING") {
    return "water";
  }

  if (taskType === "PEST_CHECK") {
    return "sun";
  }

  return "check";
}

function buildTaskCards(plants: GardenPlantSummary[]): HomeTaskCard[] {
  return plants
    .flatMap((plant) =>
      plant.careTasks.map((task) => ({
        id: task.id,
        gardenPlantId: plant.id,
        plantName: plant.nickname || plant.plantSpecies.commonName,
        action: task.title,
        timeLabel: formatRelativeDay(task.dueAt),
        icon: taskIcon(task.taskType),
        dueAt: new Date(task.dueAt).getTime(),
      })),
    )
    .filter((task) => {
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return task.dueAt <= endOfToday;
    })
    .sort((left, right) => left.dueAt - right.dueAt)
    .slice(0, 3)
    .map((task) => ({
      id: task.id,
      gardenPlantId: task.gardenPlantId,
      plantName: task.plantName,
      action: task.action,
      timeLabel: task.timeLabel,
      icon: task.icon,
    }));
}

function buildPlantCards(plants: GardenPlantSummary[]): HomePlantCard[] {
  return plants
    .filter((plant) => plant.status === "ACTIVE" || plant.status === "HARVEST_READY")
    .slice(0, 3)
    .map((plant) => {
      const timeline = plant.plantSpecies.careProfile?.growthTimeline;
      let harvestDays = plant.plantSpecies.harvestDaysMin ?? plant.plantSpecies.harvestDaysMax ?? 60;
      
      if (timeline && timeline.length > 0) {
        const cumulativeDays = timeline.reduce((acc, stage) => acc + (stage.days || 0), 0);
        harvestDays = Math.max(cumulativeDays, plant.plantSpecies.harvestDaysMin ?? 0);
      }

      const daysGrowing = Math.max(0, diffInDays(plant.plantedAt));
      const progress = Math.min(100, Math.round((daysGrowing / harvestDays) * 100));
      const imageUrl =
        plant.plantSpecies.products[0]?.coverAsset?.publicUrl ??
        fallbackPlantImage(plant.plantSpecies.category);
      const nextTask = plant.careTasks[0];

      return {
        id: plant.id,
        name: plant.nickname || plant.plantSpecies.commonName,
        subtitle: `Day ${daysGrowing} of ${harvestDays}`,
        health: toPlantHealth(plant.healthStatus),
        imageUrl,
        progress,
        taskLabel: nextTask ? nextTask.title : "No tasks scheduled",
      };
    });
}

function buildStats(stats?: GardenStats): HomeStatCard[] {
  const safeStats = stats ?? {
    totalPlants: 0,
    healthyPlants: 0,
    needsAttention: 0,
    careRate: 0,
  };

  return [
    { label: "Active Plants", value: `${safeStats.totalPlants}`, tone: "green" },
    { label: "Needs Attention", value: `${safeStats.needsAttention}`, tone: "amber" },
    { label: "Care Rate", value: `${safeStats.careRate}%`, tone: "blue" },
  ];
}

function buildMarketTeasers(listings?: MarketListing[]): HomeMarketTeaser[] {
  return (listings ?? []).slice(0, 2).map((listing) => ({
    id: listing.id,
    title: listing.product,
    sellerName: listing.seller.username,
    district: listing.seller.district ?? "Local grower",
    quantity: listing.quantity,
    price: formatPrice(listing.priceAmount),
    imageUrl: listing.imageUrl,
    createdLabel: formatFeedDate(listing.createdAt),
  }));
}

function buildLatestPost(posts?: FeedPost[]): HomePostTeaser | undefined {
  const post = posts?.[0];
  if (!post) {
    return undefined;
  }

  return {
    id: post.id,
    author: post.user.username,
    district: post.user.district ?? "Community",
    caption: post.caption,
    imageUrl: post.imageUrl,
    engagement: `${post.likes} likes · ${post.comments} comments`,
    createdLabel: formatFeedDate(post.createdAt),
  };
}

function buildStarterKits(kits?: Kit[]): HomeStarterKit[] {
  return (kits ?? []).slice(0, 2).map((kit) => ({
    id: kit.id,
    name: kit.name,
    price: kit.price,
    imageUrl: kit.image,
    description: kit.description,
  }));
}

export async function getHomeData(): Promise<HomeData> {
  const [gardenResult, statsResult, feedResult, marketResult, kitsResult] = await Promise.allSettled([
    serverGetCollection<GardenPlantSummary>("/garden"),
    serverGetValue<GardenStats>("/garden/stats"),
    serverGetCollection<FeedPost>("/community/feed?limit=1"),
    serverGetCollection<MarketListing>("/community/marketplace?limit=2"),
    serverGetCollection<Kit>("/shop/products?type=KIT"),
  ]);

  const plants = gardenResult.status === "fulfilled" ? gardenResult.value ?? [] : [];
  const stats = statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const posts = feedResult.status === "fulfilled" ? feedResult.value : undefined;
  const marketListings = marketResult.status === "fulfilled" ? marketResult.value : undefined;
  const starterKits = kitsResult.status === "fulfilled" ? kitsResult.value : undefined;

  return {
    careTasks: buildTaskCards(plants),
    plants: buildPlantCards(plants),
    stats: buildStats(stats),
    marketListings: buildMarketTeasers(marketListings),
    latestPost: buildLatestPost(posts),
    starterKits: buildStarterKits(starterKits),
  };
}
