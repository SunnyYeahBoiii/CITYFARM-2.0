import {
  Injectable,
  BadRequestException,
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

@Injectable()
export class GardenService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyGarden(userId: string) {
    return this.prisma.gardenPlant.findMany({
      where: { userId },
      orderBy: { plantedAt: 'desc' },
      include: {
        plantSpecies: {
          select: {
            id: true,
            commonName: true,
            category: true,
            harvestDaysMin: true,
            harvestDaysMax: true,
            products: {
              select: {
                coverAsset: {
                  select: {
                    publicUrl: true,
                  }
                }
              }
            }
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
  }

  async getPlantDetail(userId: string, plantId: string) {
    const plant = await this.prisma.gardenPlant.findFirst({
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
                  select: {
                    publicUrl: true,
                  }
                }
              }
            }
          },
        },
        careTasks: {
          orderBy: { dueAt: 'desc' },
        },
        journalEntries: {
          orderBy: { capturedAt: 'desc' },
          include: {
            imageAsset: {
              select: {
                publicUrl: true,
              },
            },
          },
        },
      },
    });

    if (!plant) {
      throw new NotFoundException('Plant does not exist in your garden');
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

    const plantSpeciesId = activationRecord.product.plantSpeciesId;
    if (!plantSpeciesId) {
      throw new BadRequestException('This product is not linked to a specific plant species');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const gardenPlant = await tx.gardenPlant.create({
        data: {
          userId,
          plantSpeciesId,
          activationCodeId: activationRecord.id,
          status: GardenPlantStatus.ACTIVE,
          growthStage: PlantGrowthStage.SEEDED,
          healthStatus: PlantHealthStatus.HEALTHY,
          plantedAt: now,
          nickname: activationRecord.product.plantSpecies?.commonName || 'My new plant',
        },
      });

      await this._seedDefaultCareTasks(tx, gardenPlant.id, now);

      await tx.kitActivationCode.update({
        where: { id: activationRecord.id },
        data: { redeemedAt: now },
      });

      return gardenPlant;
    });
  }

  private async _seedDefaultCareTasks(tx: any, plantId: string, plantedAt: Date) {
    const tasks = [
      {
        gardenPlantId: plantId,
        taskType: CareTaskType.WATERING,
        title: 'First watering',
        description: 'Water gently around the base of the plant to provide initial moisture.',
        dueAt: new Date(plantedAt.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: CareTaskStatus.PENDING,
      },
      {
        gardenPlantId: plantId,
        taskType: CareTaskType.PEST_CHECK,
        title: 'Check plant health',
        description: 'Check if the seedling has sprouted and if there are any strange insects.',
        dueAt: new Date(plantedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: CareTaskStatus.PENDING,
      },
      {
        gardenPlantId: plantId,
        taskType: CareTaskType.FERTILIZING,
        title: 'First fertilizing',
        description: 'Provide nutrients after the plant has stabilized its roots.',
        dueAt: new Date(plantedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: CareTaskStatus.PENDING,
      },
    ];

    for (const task of tasks) {
      await tx.careTask.create({ data: task });
    }
  }
}
