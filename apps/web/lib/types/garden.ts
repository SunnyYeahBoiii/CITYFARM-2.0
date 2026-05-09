export type GardenPlantStatus = 'PLANNED' | 'ACTIVE' | 'HARVEST_READY' | 'HARVESTED' | 'FAILED' | 'ARCHIVED';

export type PlantGrowthStage = 'SEEDED' | 'SPROUTING' | 'VEGETATIVE'| 'FLOWERING' | 'FRUITING' | 'HARVEST_READY' | 'HARVESTED';

export type PlantHealthStatus = 'UNKNOWN' | 'HEALTHY' | 'WARNING' | 'CRITICAL';

export type CareTaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';

export interface GrowthTimelineStage {
  stage: 'seedling' | 'vegetative' | 'harvest_window' | string;
  days: number;
}

export interface CareTaskItem {
  id: string;
  taskType: string;
  title: string;
  description: string | null;
  status: CareTaskStatus;
  dueAt: string;
  completedAt: string | null;
  aiSummary: string | null;
}

export interface JournalEntryItem {
  id: string;
  capturedAt: string;
  note: string | null;
  healthStatus: PlantHealthStatus | null;
  leafColorNote: string | null;
  issueSummary: string | null;
  recommendationSummary: string | null;
  aiAnalysis?: {
    taskHistory?: JournalTaskHistoryEvent[];
    [key: string]: unknown;
  } | null;
  imageAsset: {
    id: string;
    publicUrl: string;
  } | null;
}

export interface JournalTaskHistoryEvent {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  taskId: string;
  title?: string;
  taskType?: string;
  changes?: Record<string, unknown>;
  imageAssetId?: string;
  source?: string;
  timestamp?: string;
}

export interface GardenStats {
  totalPlants: number;
  healthyPlants: number;
  needsAttention: number;
  careRate: number;
}

export interface GardenPlantSummary {
  id: string;
  nickname: string | null;
  status: GardenPlantStatus;
  growthStage: PlantGrowthStage;
  healthStatus: PlantHealthStatus;
  plantedAt: string;
  expectedHarvestAt: string | null;
  lastCareAt: string | null;
  lastJournaledAt: string | null;
  plantSpecies: {
    id: string;
    commonName: string;
    category: string;
    harvestDaysMin: number | null;
    harvestDaysMax: number | null;
    products: {
      coverAsset: {
        publicUrl: string;
      } | null;
    }[];
    careProfile: {
      growthTimeline: GrowthTimelineStage[] | null;
    } | null;
  };
  _count: {
    journalEntries: number;
  };
  careTasks: Pick<CareTaskItem, 'id' | 'taskType' | 'title' | 'dueAt'>[];
}

export interface GardenPlantDetail extends GardenPlantSummary {
  notes: string | null;
  zoneName: string | null;
  locationDetail: string | null;
  plantSpecies: GardenPlantSummary['plantSpecies'] & {
    scientificName: string;
    description: string | null;
    difficulty: string;
    humidityNotes: string | null;
    careProfile: {
      sunlightSummary: string | null;
      wateringSummary: string | null;
      soilSummary: string | null;
      fertilizingSummary: string | null;
      companionNotes: string | null;
      growthTimeline: GrowthTimelineStage[] | null;
    } | null;
  };
  careTasks: CareTaskItem[];
  journalEntries: JournalEntryItem[];
  listings?: { id: string; status: string }[];
}

export interface LogCarePayload {
  taskId: string;
}

export interface LogJournalPayload {
  note?: string;
  healthStatus?: PlantHealthStatus;
  growthStage?: PlantGrowthStage;
  leafColorNote?: string;
  issueSummary?: string;
  imageAssetId?: string;
}
