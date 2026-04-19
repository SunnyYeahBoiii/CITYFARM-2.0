import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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


export interface GardenStats {
  totalPlants: number;
  healthyPlants: number;
  needsAttention: number;
  careRate: number;
}

@Injectable()
export class GardenService {
  private _statsCache = new Map<string, { stats: GardenStats; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

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
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      let aiData = {};
      if (dto.imageAssetId) {
        aiData = this._getMockAiAnalysis();
      }

      const entry = await tx.plantJournalEntry.create({
        data: {
          gardenPlantId: plantId,
          capturedAt: now,
          note: dto.note,
          healthStatus: dto.healthStatus || (aiData as any).healthStatus,
          leafColorNote: (aiData as any).leafColorNote,
          issueSummary: (aiData as any).issueSummary,
          recommendationSummary: (aiData as any).recommendationSummary,
          aiAnalysis: aiData,
          imageAssetId: dto.imageAssetId,
        },
        include: {
          imageAsset: { select: { publicUrl: true } },
        },
      });

      const plantUpdate: Record<string, any> = { lastJournaledAt: now };
      const finalHealth = dto.healthStatus || (aiData as any).healthStatus;
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
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    await this.prisma.plantJournalEntry.delete({ where: { id: journalId } });

    return { success: true };
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

  private _getMockAiAnalysis() {
    const healthStatuses = [PlantHealthStatus.HEALTHY, PlantHealthStatus.WARNING];
    const health = healthStatuses[Math.floor(Math.random() * healthStatuses.length)];

    const observations = {
      [PlantHealthStatus.HEALTHY]: [
        { leaf: 'Green and vibrant', issue: 'None detected', rec: 'Continue current watering schedule.' },
        { leaf: 'Normal growth', issue: 'None', rec: 'Keep monitoring soil moisture.' },
      ],
      [PlantHealthStatus.WARNING]: [
        { leaf: 'Slight yellowing on edges', issue: 'Potential overwatering', rec: 'Reduce watering frequency for 3 days.' },
        { leaf: 'Pest marks detected', issue: 'Possible spider mites', rec: 'Apply neem oil spray in the evening.' },
      ],
    };

    const obsList = observations[health as keyof typeof observations] || observations[PlantHealthStatus.HEALTHY];
    const picked = obsList[Math.floor(Math.random() * obsList.length)];

    return {
      healthStatus: health,
      leafColorNote: picked.leaf,
      issueSummary: picked.issue,
      recommendationSummary: picked.rec,
      analyzedAt: new Date().toISOString(),
      confidenceScore: 0.92,
    };
  }
}
