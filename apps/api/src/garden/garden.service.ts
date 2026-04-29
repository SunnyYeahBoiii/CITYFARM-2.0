import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import {
  CareTaskStatus,
  CareTaskType,
  GardenPlantStatus,
  PlantGrowthStage,
  PlantHealthStatus,
} from 'generated/prisma/enums';
import {
  getCareScheduleForSpecies,
} from './constants/plant-care-data';
import { LogCareDto } from 'src/dtos/garden/log-care.dto';
import { LogJournalDto } from 'src/dtos/garden/log-journal.dto';
import { CreateCareTaskDto } from 'src/dtos/garden/create-care-task.dto';
import { ModelApiService } from '../ai/model-api.service';
import { SupabaseStorageService } from '../assets/supabase-storage.service';


export interface GardenStats {
  totalPlants: number;
  healthyPlants: number;
  needsAttention: number;
  careRate: number;
}

@Injectable()
export class GardenService {
  private _statsCache = new Map<string, { stats: GardenStats; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelApiService: ModelApiService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  private _invalidateStatsCache(userId: string) {
    this._statsCache.delete(userId);
  }

  async getGardenStats(userId: string): Promise<GardenStats> {
    const cached = this._statsCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.stats;
    }

    const now = new Date();
    
    const [plants, completedTasks, dueTasks] = await Promise.all([
      this.prisma.gardenPlant.findMany({
        where: { userId, status: GardenPlantStatus.ACTIVE },
        select: { healthStatus: true },
      }),
      this.prisma.careTask.count({
        where: {
          gardenPlant: { userId },
          status: CareTaskStatus.COMPLETED,
          dueAt: { lte: now },
        },
      }),
      this.prisma.careTask.count({
        where: {
          gardenPlant: { userId },
          dueAt: { lte: now },
        },
      }),
    ]);

    const stats: GardenStats = {
      totalPlants: plants.length,
      healthyPlants: plants.filter((p) => p.healthStatus === PlantHealthStatus.HEALTHY).length,
      needsAttention: plants.filter(
        (p) =>
          p.healthStatus === PlantHealthStatus.WARNING ||
          p.healthStatus === PlantHealthStatus.CRITICAL,
      ).length,
      careRate: dueTasks > 0 ? Math.round((completedTasks / dueTasks) * 100) : 100,
    };

    this._statsCache.set(userId, {
      stats,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return stats;
  }

  private async _syncGrowthStage(
    tx: any,
    plant: { id: string; growthStage: PlantGrowthStage; plantedAt: Date; growthTimeline: any },
  ) {
    const timeline = plant.growthTimeline as any;
    if (!timeline) return plant.growthStage;

    const stages: PlantGrowthStage[] = [
      PlantGrowthStage.SEEDED,
      PlantGrowthStage.SPROUTING,
      PlantGrowthStage.VEGETATIVE,
      PlantGrowthStage.FLOWERING,
      PlantGrowthStage.FRUITING,
      PlantGrowthStage.HARVEST_READY,
      PlantGrowthStage.HARVESTED,
    ];

    const now = new Date();
    const daysElapsed = Math.floor(
      (now.getTime() - new Date(plant.plantedAt).getTime()) / (24 * 60 * 60 * 1000),
    );

    let targetStage: PlantGrowthStage = PlantGrowthStage.SEEDED;
    if (daysElapsed >= timeline.harvestReady) targetStage = PlantGrowthStage.HARVEST_READY;
    else if (timeline.fruiting && daysElapsed >= timeline.fruiting) targetStage = PlantGrowthStage.FRUITING;
    else if (timeline.flowering && daysElapsed >= timeline.flowering) targetStage = PlantGrowthStage.FLOWERING;
    else if (daysElapsed >= timeline.vegetative) targetStage = PlantGrowthStage.VEGETATIVE;
    else if (daysElapsed >= timeline.sprouting) targetStage = PlantGrowthStage.SPROUTING;

    const currentIdx = stages.indexOf(plant.growthStage);
    const targetIdx = stages.indexOf(targetStage);

    if (targetIdx > currentIdx) {
      await tx.gardenPlant.update({
        where: { id: plant.id },
        data: { growthStage: targetStage },
      });
      return targetStage;
    }

    return plant.growthStage;
  }

  async getMyGarden(userId: string) {
    const plants = await this.prisma.gardenPlant.findMany({
      where: { userId },
      orderBy: { plantedAt: 'desc' },
      include: {
        plantSpecies: {
          select: {
            id: true,
            slug: true,
            commonName: true,
            category: true,
            harvestDaysMin: true,
            harvestDaysMax: true,
            careProfile: {
              select: { growthTimeline: true },
            },
            products: {
              select: {
                coverAsset: {
                  select: { publicUrl: true },
                },
              },
            },
          },
        },
        _count: {
          select: { journalEntries: true },
        },
        careTasks: {
          where: { status: CareTaskStatus.PENDING },
          orderBy: { dueAt: 'asc' },
          take: 1,
        },
      },
    });

    for (const plant of plants.filter(p => p.status === GardenPlantStatus.ACTIVE)) {
      await this._syncGrowthStage(this.prisma, {
        id: plant.id,
        growthStage: plant.growthStage,
        plantedAt: plant.plantedAt,
        growthTimeline: plant.plantSpecies.careProfile?.growthTimeline,
      });
    }

    return plants;
  }

  async getPlantDetail(userId: string, plantId: string) {
    let plant = await this.prisma.gardenPlant.findFirst({
      where: { id: plantId, userId },
      include: {
        plantSpecies: {
          include: {
            careProfile: true,
            products: {
              select: {
                id: true,
                name: true,
                coverAsset: {
                  select: { publicUrl: true },
                },
              },
            },
          },
        },
        careTasks: {
          orderBy: { dueAt: 'asc' },
        },
        journalEntries: {
          orderBy: { capturedAt: 'desc' },
          include: {
            imageAsset: {
              select: { id: true, publicUrl: true },
            },
          },
        },
        listings: {
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!plant) {
      throw new NotFoundException('Plant does not exist in your garden');
    }

    if (plant.status === GardenPlantStatus.ACTIVE) {
      const newStage = await this._syncGrowthStage(this.prisma, {
        id: plant.id,
        growthStage: plant.growthStage,
        plantedAt: plant.plantedAt,
        growthTimeline: plant.plantSpecies.careProfile?.growthTimeline,
      });
      plant.growthStage = newStage;
    }

    return plant;
  }

  async activateCode(userId: string, code: string) {
    const activationRecord = await this.prisma.kitActivationCode.findUnique({
      where: { code },
      include: {
        product: {
          include: {
            plantSpecies: true,
          },
        },
      },
    });

    if (!activationRecord) {
      throw new NotFoundException('Invalid activation code');
    }

    if (activationRecord.redeemedAt) {
      throw new BadRequestException('This code has been used');
    }

    if (activationRecord.expiresAt && activationRecord.expiresAt < new Date()) {
      throw new BadRequestException('Activation code has expired');
    }

    const plantSpecies = activationRecord.product.plantSpecies;
    if (!plantSpecies) {
      throw new BadRequestException('This product is not linked to a specific plant species');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const gardenPlant = await tx.gardenPlant.create({
        data: {
          userId,
          plantSpeciesId: plantSpecies.id,
          activationCodeId: activationRecord.id,
          status: GardenPlantStatus.ACTIVE,
          growthStage: PlantGrowthStage.SEEDED,
          healthStatus: PlantHealthStatus.HEALTHY,
          plantedAt: now,
          nickname: plantSpecies.commonName,
        },
      });

      await this._seedCareSchedulesAndTasks(tx, gardenPlant.id, plantSpecies.slug, now);

      await tx.kitActivationCode.update({
        where: { id: activationRecord.id },
        data: { redeemedAt: now },
      });

      this._invalidateStatsCache(userId);

      return gardenPlant;
    });
  }

  async logCare(userId: string, plantId: string, dto: LogCareDto) {
    const task = await this.prisma.careTask.findFirst({
      where: { id: dto.taskId, gardenPlantId: plantId, gardenPlant: { userId } },
      include: { schedule: true },
    });

    if (!task) {
      throw new NotFoundException('Care task not found');
    }

    if (task.status === CareTaskStatus.COMPLETED) {
      throw new BadRequestException('Task is already completed');
    }

    const now = new Date();
    const taskDueAt = new Date(task.dueAt);
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const todayStr = formatter.format(now);
    const taskDueStr = formatter.format(taskDueAt);

    if (now < taskDueAt && todayStr !== taskDueStr) {
      throw new BadRequestException(`Task is not due yet. This task is scheduled for ${taskDueStr}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.careTask.update({
        where: { id: task.id },
        data: {
          status: CareTaskStatus.COMPLETED,
          completedAt: now,
        },
      });

      await tx.gardenPlant.update({
        where: { id: plantId },
        data: { lastCareAt: now },
      });

      await tx.userProfile.updateMany({
        where: { userId },
        data: { totalCareLogs: { increment: 1 } },
      });

      if (task.taskType === CareTaskType.HARVEST) {
        await tx.gardenPlant.update({
          where: { id: plantId },
          data: {
            status: GardenPlantStatus.HARVESTED,
            growthStage: PlantGrowthStage.HARVESTED,
            actualHarvestAt: now,
          },
        });

        await tx.userProfile.updateMany({
          where: { userId },
          data: { totalHarvests: { increment: 1 } },
        });

        await tx.careSchedule.updateMany({
          where: { gardenPlantId: plantId },
          data: { isActive: false },
        });

        this._invalidateStatsCache(userId);

        return { success: true, harvested: true };
      }

      if (task.schedule && task.schedule.isActive && task.schedule.cadenceDays) {
        const nextDueAt = new Date(
          now.getTime() + task.schedule.cadenceDays * 24 * 60 * 60 * 1000,
        );

        await tx.careTask.create({
          data: {
            gardenPlantId: plantId,
            scheduleId: task.schedule.id,
            taskType: task.taskType,
            title: task.title,
            description: task.description,
            dueAt: nextDueAt,
            status: CareTaskStatus.PENDING,
          },
        });
      }

      return { success: true, harvested: false };
    });
  }


  async logJournal(userId: string, plantId: string, dto: LogJournalDto) {
    const plant = await this.prisma.gardenPlant.findFirst({
      where: { id: plantId, userId },
      include: {
        plantSpecies: {
          select: {
            commonName: true,
            scientificName: true,
            category: true,
          },
        },
      },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    const now = new Date();
    const asset = dto.imageAssetId
      ? await this.prisma.mediaAsset.findFirst({
          where: {
            id: dto.imageAssetId,
            ownerId: userId,
            kind: 'GARDEN_JOURNAL',
          },
        })
      : null;

    if (dto.imageAssetId && !asset) {
      throw new BadRequestException('Journal image asset is invalid or not owned by this user.');
    }

    const aiData = asset
      ? await this._analyzeJournalImage(asset.storageKey, {
          plantName: plant.nickname || plant.plantSpecies.commonName,
          scientificName: plant.plantSpecies.scientificName,
          plantType: plant.plantSpecies.category,
          growthStage: plant.growthStage,
          userNote: dto.note,
        })
      : null;

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.plantJournalEntry.create({
        data: {
          gardenPlantId: plantId,
          capturedAt: now,
          note: dto.note,
          healthStatus:
            dto.healthStatus || aiData?.healthStatus || undefined,
          leafColorNote:
            dto.leafColorNote || aiData?.leafColorNote || undefined,
          issueSummary:
            dto.issueSummary || aiData?.issueSummary || undefined,
          recommendationSummary: aiData?.recommendationSummary || undefined,
          aiAnalysis: aiData?.raw
            ? (JSON.parse(JSON.stringify(aiData.raw)) as Prisma.InputJsonValue)
            : undefined,
          imageAssetId: dto.imageAssetId,
        },
        include: {
          imageAsset: { select: { id: true, publicUrl: true } },
        },
      });

      const plantUpdate: Record<string, any> = { lastJournaledAt: now };
      const finalHealth = dto.healthStatus || aiData?.healthStatus;
      if (finalHealth) plantUpdate.healthStatus = finalHealth;
      if (dto.growthStage) plantUpdate.growthStage = dto.growthStage;

      await tx.gardenPlant.update({
        where: { id: plantId },
        data: plantUpdate,
      });

      return entry;
    });
  }

  async deleteJournal(userId: string, plantId: string, journalId: string) {
    const entry = await this.prisma.plantJournalEntry.findFirst({
      where: { id: journalId, gardenPlantId: plantId, gardenPlant: { userId } },
      include: {
        imageAsset: {
          select: {
            id: true,
            storageKey: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.plantJournalEntry.delete({ where: { id: journalId } });

      const latestRemaining = await tx.plantJournalEntry.findFirst({
        where: { gardenPlantId: plantId },
        orderBy: { capturedAt: 'desc' },
        select: {
          capturedAt: true,
          healthStatus: true,
        },
      });

      await tx.gardenPlant.update({
        where: { id: plantId },
        data: {
          lastJournaledAt: latestRemaining?.capturedAt ?? null,
          healthStatus: latestRemaining?.healthStatus ?? PlantHealthStatus.UNKNOWN,
        },
      });
    });

    if (entry.imageAssetId) {
      const remainingReferences = await this.prisma.plantJournalEntry.count({
        where: { imageAssetId: entry.imageAssetId },
      });

      if (remainingReferences === 0 && entry.imageAsset?.storageKey) {
        await this.storageService.deleteFile(entry.imageAsset.storageKey);
        await this.prisma.mediaAsset.delete({
          where: { id: entry.imageAssetId },
        }).catch((error) => {
          console.error('Failed to delete orphaned journal media asset:', error);
        });
      }
    }

    return { success: true };
  }

  async createCareTask(
    userId: string,
    plantId: string,
    dto: CreateCareTaskDto,
  ) {
    // Verify plant ownership
    const plant = await this.prisma.gardenPlant.findUnique({
      where: { id: plantId, userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found or not owned by user');
    }

    // Check for duplicate pending task
    const existingTask = await this.prisma.careTask.findFirst({
      where: {
        gardenPlantId: plantId,
        taskType: dto.taskType as CareTaskType,
        status: CareTaskStatus.PENDING,
        title: dto.title,
      },
    });

    if (existingTask) {
      return existingTask;
    }

    // Parse dueAt or default to today
    const dueAt = dto.dueAt ? new Date(dto.dueAt) : new Date();

    // Create new task
    const task = await this.prisma.careTask.create({
      data: {
        gardenPlantId: plantId,
        taskType: dto.taskType as CareTaskType,
        title: dto.title,
        description: dto.notes,
        dueAt,
        status: CareTaskStatus.PENDING,
        createdBy: 'AI_ASSISTANT',
      },
    });

    this._invalidateStatsCache(userId);

    return task;
  }

  async logJournalEntry(
    userId: string,
    plantId: string,
    dto: { note: string; healthStatus: string; issueSummary?: string },
  ) {
    // Verify plant ownership
    const plant = await this.prisma.gardenPlant.findFirst({
      where: { id: plantId, userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    const now = new Date();

    const entry = await this.prisma.plantJournalEntry.create({
      data: {
        gardenPlantId: plantId,
        capturedAt: now,
        note: dto.note,
        healthStatus: dto.healthStatus as PlantHealthStatus,
        issueSummary: dto.issueSummary,
      },
    });

    // Update plant health status and lastJournaledAt
    await this.prisma.gardenPlant.update({
      where: { id: plantId },
      data: {
        lastJournaledAt: now,
        healthStatus: dto.healthStatus as PlantHealthStatus,
      },
    });

    return entry;
  }

  private async _analyzeJournalImage(
    storageKey: string,
    context: {
      plantName?: string | null;
      scientificName?: string | null;
      plantType?: string | null;
      growthStage?: string | null;
      userNote?: string | null;
    },
  ) {
    const fileBuffer = await this.storageService.downloadFile(storageKey);
    const imageBase64 = fileBuffer.toString('base64');
    const response = (await this.modelApiService.analyzePlantHealth({
      imageBase64,
      context,
    })) as {
      healthStatus?: unknown;
      diagnosisSummary?: unknown;
      recommendationSummary?: unknown;
      analysis?: Record<string, unknown>;
      confidenceScore?: unknown;
      success?: unknown;
    };

    const rawHealthStatus =
      typeof response.healthStatus === 'string'
        ? response.healthStatus.toUpperCase()
        : 'UNKNOWN';
    const healthStatus = (
      ['UNKNOWN', 'HEALTHY', 'WARNING', 'CRITICAL'].includes(rawHealthStatus)
        ? rawHealthStatus
        : 'UNKNOWN'
    ) as PlantHealthStatus;

    const analysis = response.analysis ?? {};
    const leafColorCandidates = [
      analysis.leafColorNote,
      analysis.leafColor,
      analysis.colorObservation,
      analysis.symptoms,
    ];
    const leafColorNote = leafColorCandidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );

    const issueSummaryCandidates = [
      response.diagnosisSummary,
      analysis.issueSummary,
      analysis.likelyIssues,
      analysis.summary,
    ];
    const issueSummary = issueSummaryCandidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );

    const recommendationCandidates = [
      response.recommendationSummary,
      analysis.recommendationSummary,
      analysis.immediateActions,
      analysis.followUpCare,
    ];
    const recommendationSummary = recommendationCandidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );

    return {
      healthStatus,
      leafColorNote:
        typeof leafColorNote === 'string' ? leafColorNote : undefined,
      issueSummary:
        typeof issueSummary === 'string' ? issueSummary : undefined,
      recommendationSummary:
        typeof recommendationSummary === 'string'
          ? recommendationSummary
          : undefined,
      raw: {
        success: response.success ?? true,
        confidenceScore: response.confidenceScore ?? null,
        context,
        ...response,
      },
    };
  }


  private async _seedCareSchedulesAndTasks(
    tx: any,
    plantId: string,
    speciesSlug: string,
    plantedAt: Date,
  ) {
    const scheduleData = getCareScheduleForSpecies(speciesSlug);

    for (const def of scheduleData) {
      const startsAt = plantedAt;
      const firstDueAt = new Date(plantedAt.getTime() + def.cadenceDays * 24 * 60 * 60 * 1000);

      const schedule = await tx.careSchedule.create({
        data: {
          gardenPlantId: plantId,
          taskType: def.taskType,
          title: def.title,
          description: def.description,
          cadenceDays: def.cadenceDays,
          preferredHour: def.preferredHour,
          preferredMinute: 0,
          startsAt,
          isActive: true,
        },
      });

      await tx.careTask.create({
        data: {
          gardenPlantId: plantId,
          scheduleId: schedule.id,
          taskType: def.taskType,
          title: def.title,
          description: def.description,
          dueAt: firstDueAt,
          status: CareTaskStatus.PENDING,
        },
      });
    }
  }

}
