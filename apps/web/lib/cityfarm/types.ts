export type PlantHealth = "healthy" | "warning" | "critical";

export interface PlantTimelineStage {
  day: number;
  stage: string;
  date: string;
  completed: boolean;
}

export interface CareHistoryEntry {
  id: string;
  date: string;
  action: string;
  time: string;
  aiDetection: string;
  status: "completed";
}

export interface JournalEntry {
  id: string;
  date: string;
  photo: string;
  aiAnalysis: {
    health: "Healthy" | "Warning" | "Critical";
    leafColor: string;
    issues: string;
    recommendation: string;
  };
}

export interface Plant {
  id: string;
  name: string;
  type: string;
  code: string;
  plantedDate: string;
  daysGrowing: number;
  harvestDays: number;
  health: PlantHealth;
  imageUrl: string;
  nextWatering: string;
  nextFertilizing: string;
  progress: number;
  zone: string;
  note: string;
  careHistory: CareHistoryEntry[];
  journal: JournalEntry[];
}

export interface Reminder {
  id: string;
  plant: string;
  action: string;
  time: string;
  icon: "water" | "sun" | "check";
}

export interface FeedPost {
  id: string;
  type: "showcase" | "question" | "plant-share";
  user: string;
  location: string;
  caption: string;
  image?: string;
  sharedPlantId?: string;
  likes: number;
  comments: number;
  time: string;
  tags: string[];
  isLiked: boolean;
}

export interface MarketListing {
  id: string;
  seller: {
    name: string;
    district: string;
    verifiedGrower: boolean;
  };
  plant: string;
  quantity: string;
  price: string;
  imageUrl: string;
  description: string;
  postedTime: string;
  plantingLogs: number;
}

export interface ScanRecommendation {
  id: string;
  name: string;
  scientificName: string;
  difficulty: string;
  harvestDays: string;
  matchScore: number;
  reason: string;
  imageUrl: string;
  sunlight: string;
  water: string;
  climate: string;
}

export interface ScanAnalysis {
  lightLevel: string;
  lightScore: number;
  areaSize: string;
  climate: string;
  capacity: string;
}

export interface HomeStat {
  label: string;
  value: string;
  tone: "green" | "blue" | "amber";
}
