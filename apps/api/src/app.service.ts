import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ModelApiService } from './ai/model-api.service';
import { SupabaseStorageService } from './assets/supabase-storage.service';

type WebDemoContext = {
  name: string;
  type: string;
  health: string;
  daysGrowing: number;
  note: string;
};

type PlantCatalogItem = {
  id: string;
  commonName: string;
  scientificName: string;
  category: string;
  difficulty: string;
  lightRequirement: string;
  minLightScore: number | null;
  maxLightScore: number | null;
  recommendedMinAreaSqm: unknown;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  harvestDaysMin: number | null;
  harvestDaysMax: number | null;
  products: Array<{
    type: string;
    createdAt: Date;
    coverAsset: {
      publicUrl: string;
      storageKey: string;
    } | null;
  }>;
};

type PlantAsset = {
  publicUrl: string;
  storageKey: string;
};

type SpaceRecommendation = Record<string, unknown>;

type SpaceLayoutResponse = {
  success?: boolean;
  analysis?: unknown;
  recommendations?: SpaceRecommendation[];
  best_location?: unknown;
};

type SpaceVisualizationResponse = {
  success?: boolean;
  visualizedImage?: unknown;
};

const PRODUCT_TYPE_PRIORITY: Record<string, number> = {
  SEED: 0,
  KIT: 1,
  SOIL: 2,
  POT: 3,
  SENSOR: 4,
  ADD_ON: 5,
};

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modelApiService: ModelApiService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  private isWebDemoContext(c: unknown): c is WebDemoContext {
    if (!c || typeof c !== 'object') return false;
    const o = c as Record<string, unknown>;
    return (
      typeof o.name === 'string' &&
      typeof o.type === 'string' &&
      typeof o.health === 'string' &&
      typeof o.daysGrowing === 'number' &&
      typeof o.note === 'string' &&
      !('species' in o)
    );
  }

  private webDemoContextToRag(context: WebDemoContext) {
    return {
      user: {
        displayName: 'Người dùng',
        bio: 'Không có bio',
        location: 'Chưa cập nhật',
      },
      species: {
        commonName: context.name,
        scientificName: context.type,
        difficulty: 'Chưa cập nhật',
        lightRequirement: 'Chưa cập nhật',
        careGuide: {},
      },
      currentPlant: {
        nickname: context.name,
        status: 'Chưa cập nhật',
        health: context.health,
        growthStage: 'Chưa cập nhật',
        daysGrowing: context.daysGrowing,
        zoneName: 'Chưa cập nhật',
        notes: context.note,
      },
      history: {
        recentTasks: [] as string[],
        recentJournals: [] as string[],
      },
    };
  }

  async handleChatRequest(
    userId: string,
    body: { message: string; plantId?: string; context?: unknown },
  ) {
    const { message, plantId, context } = body;
    const pid = plantId?.trim();

    if (pid) {
      return this.processChatRequest(userId, pid, message);
    }

    if (this.isWebDemoContext(context)) {
      const ragContext = this.webDemoContextToRag(context);
      return this.modelApiService.getChatAdvice({ message, context: ragContext });
    }

    const ctx =
      context !== undefined && context !== null && typeof context === 'object'
        ? context
        : {};

    return this.modelApiService.getChatAdvice({ message, context: ctx });
  }

  private async findOrCreateAIConversation(userId: string, plantId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'AI_ASSISTANT',
        participants: { some: { userId } },
        assistantContext: { path: ['plantId'], equals: plantId },
      },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        type: 'AI_ASSISTANT',
        assistantContext: { plantId },
        participants: { create: { userId } },
      },
    });
  }

  async processChatRequest(userId: string, plantId: string, message: string) {
    const plantData = await this.prisma.gardenPlant.findUnique({
      where: { id: plantId, userId },
      include: {
        user: { include: { profile: true } },
        plantSpecies: { include: { careProfile: true } },
        careTasks: {
          where: { status: { in: ['COMPLETED', 'SKIPPED'] } },
          orderBy: { completedAt: 'desc' },
          take: 3,
        },
        journalEntries: {
          orderBy: { capturedAt: 'desc' },
          take: 2,
        },
      },
    });

    if (!plantData) {
      throw new NotFoundException('Không tìm thấy cây này trong vườn của bạn!');
    }

    const conversation = await this.findOrCreateAIConversation(userId, plantId);

    const previousMessages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const chatHistory = previousMessages
      .filter((m) => m.body)
      .map((m) => ({
        role: m.senderType === 'USER' ? 'user' : 'assistant',
        content: m.body as string,
      }));

    const ragContext = {
      user: {
        displayName: plantData.user.profile?.displayName || 'Người dùng',
        bio: plantData.user.profile?.bio || 'Không có bio',
        location: `${plantData.user.profile?.district}, ${plantData.user.profile?.city}`,
      },
      species: {
        commonName: plantData.plantSpecies.commonName,
        scientificName: plantData.plantSpecies.scientificName,
        difficulty: plantData.plantSpecies.difficulty,
        lightRequirement: plantData.plantSpecies.lightRequirement,
        careGuide: {
          sunlight: plantData.plantSpecies.careProfile?.sunlightSummary,
          watering: plantData.plantSpecies.careProfile?.wateringSummary,
          pests: plantData.plantSpecies.careProfile?.commonPests,
        },
      },
      currentPlant: {
        nickname: plantData.nickname,
        status: plantData.status,
        health: plantData.healthStatus,
        growthStage: plantData.growthStage,
        daysGrowing: Math.floor(
          (Date.now() - plantData.plantedAt.getTime()) / (1000 * 3600 * 24),
        ),
        zoneName: plantData.zoneName,
        notes: plantData.notes,
      },
      history: {
        recentTasks: plantData.careTasks.map(
          (t) =>
            `${t.taskType} - ${t.completedAt?.toISOString().split('T')[0]}`,
        ),
        recentJournals: plantData.journalEntries.map(
          (j) =>
            `Sức khỏe: ${j.healthStatus} - Ghi chú: ${j.issueSummary || 'Bình thường'}`,
        ),
      },
    };

    const aiResponse = await this.modelApiService.getChatAdvice({
      message,
      context: ragContext,
      history: chatHistory,
    });

    try {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderUserId: userId,
          senderType: 'USER',
          messageType: 'TEXT',
          body: message,
        },
      });

      if (
        typeof aiResponse === 'object' &&
        aiResponse !== null &&
        'success' in aiResponse &&
        aiResponse.success &&
        'reply' in aiResponse &&
        typeof aiResponse.reply === 'string'
      ) {
        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'ASSISTANT',
            messageType: 'TEXT',
            body: aiResponse.reply,
          },
        });
      }
    } catch (err: unknown) {
      console.error('[Chat History] Lỗi khi lưu tin nhắn:', err);
    }

    return {
      ...(typeof aiResponse === 'object' && aiResponse !== null ? aiResponse : {}),
      conversationId: conversation.id,
    };
  }

  async getPlantCatalog(): Promise<PlantCatalogItem[]> {
    return this.prisma.plantSpecies.findMany({
      where: {
        isHcmcSuitable: true,
      },
      select: {
        id: true,
        commonName: true,
        scientificName: true,
        category: true,
        difficulty: true,
        lightRequirement: true,
        minLightScore: true,
        maxLightScore: true,
        recommendedMinAreaSqm: true,
        temperatureMinC: true,
        temperatureMaxC: true,
        harvestDaysMin: true,
        harvestDaysMax: true,
        products: {
          where: {
            isActive: true,
            coverAssetId: {
              not: null,
            },
          },
          select: {
            type: true,
            createdAt: true,
            coverAsset: {
              select: {
                publicUrl: true,
                storageKey: true,
              },
            },
          },
        },
      },
    });
  }

  private pickBestPlantAsset(plant: PlantCatalogItem): PlantAsset | null {
    const sortedProducts = [...plant.products].sort((left, right) => {
      const typeDelta =
        (PRODUCT_TYPE_PRIORITY[left.type] ?? Number.MAX_SAFE_INTEGER) -
        (PRODUCT_TYPE_PRIORITY[right.type] ?? Number.MAX_SAFE_INTEGER);

      if (typeDelta !== 0) {
        return typeDelta;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    const bestProduct = sortedProducts.find((product) => product.coverAsset);
    if (!bestProduct?.coverAsset) {
      return null;
    }

    return {
      publicUrl: bestProduct.coverAsset.publicUrl,
      storageKey: bestProduct.coverAsset.storageKey,
    };
  }

  private buildPlantAssetMap(plants: PlantCatalogItem[]) {
    return new Map(
      plants.map((plant) => [plant.id, this.pickBestPlantAsset(plant)]),
    );
  }

  private buildPlantCatalogText(plants: PlantCatalogItem[]) {
    return plants
      .map(
        (p) =>
          [
            `[ID: ${p.id}]`,
            `Tên: ${p.commonName} (${p.scientificName})`,
            `Loại: ${p.category}`,
            `Độ khó: ${p.difficulty}`,
            `Nắng: ${p.lightRequirement}`,
            `Điểm sáng: ${p.minLightScore ?? 0}-${p.maxLightScore ?? 100}`,
            `Diện tích min: ${p.recommendedMinAreaSqm ?? 'Không rõ'}m2`,
            `Nhiệt độ: ${p.temperatureMinC ?? '?'}-${p.temperatureMaxC ?? '?'}°C`,
            `Thu hoạch: ${p.harvestDaysMin ?? '?'}-${p.harvestDaysMax ?? '?'} ngày`,
          ].join(' | '),
      )
      .join('\n');
  }

  private getRecommendationScore(recommendation: SpaceRecommendation) {
    const rawScore = recommendation.matchScore;
    if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
      return rawScore;
    }

    if (typeof rawScore === 'string') {
      const parsed = Number(rawScore);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return Number.NEGATIVE_INFINITY;
  }

  private selectTopRecommendation(recommendations: SpaceRecommendation[]) {
    let topRecommendation: SpaceRecommendation | null = null;
    let topScore = Number.NEGATIVE_INFINITY;

    for (const recommendation of recommendations) {
      const score = this.getRecommendationScore(recommendation);
      if (score > topScore) {
        topRecommendation = recommendation;
        topScore = score;
      }
    }

    return topRecommendation;
  }

  private normalizeBestLocation(
    value: unknown,
  ): [number, number, number, number] | null {
    if (!Array.isArray(value) || value.length !== 4) {
      return null;
    }

    const coordinates = value.map((entry) => Number(entry));
    if (coordinates.some((entry) => !Number.isFinite(entry))) {
      return null;
    }

    return [
      Math.trunc(coordinates[0]),
      Math.trunc(coordinates[1]),
      Math.trunc(coordinates[2]),
      Math.trunc(coordinates[3]),
    ];
  }

  private async renderSpaceVisualization(
    spaceImageBase64: string,
    plantImageBase64: string,
    bestLocation: [number, number, number, number],
  ) {
    const response = (await this.modelApiService.renderSpaceVisualization({
      spaceImageBase64,
      plantImageBase64,
      bestLocation,
    })) as SpaceVisualizationResponse;

    return typeof response.visualizedImage === 'string'
      ? response.visualizedImage
      : '';
  }

  async analyzeSpace(file: Express.Multer.File, plantCatalogText?: string) {
    const plants = await this.getPlantCatalog();
    const catalog = plantCatalogText || this.buildPlantCatalogText(plants);
    const imageBase64 = file.buffer.toString('base64');

    const response = (await this.modelApiService.analyzeSpaceLayout({
      imageBase64,
      plantCatalogText: catalog,
    })) as SpaceLayoutResponse;

    const plantAssetById = this.buildPlantAssetMap(plants);
    const rawRecommendations = Array.isArray(response.recommendations)
      ? response.recommendations
      : [];

    const recommendations = rawRecommendations.map(
      (recommendation) => {
        const id =
          typeof recommendation.id === 'string' ? recommendation.id : '';
        const plantAsset = id ? plantAssetById.get(id) : null;
        return {
          ...recommendation,
          imageUrl:
            plantAsset?.publicUrl ??
            (typeof recommendation.imageUrl === 'string'
              ? recommendation.imageUrl
              : ''),
        };
      },
    );

    let visualizedImage = '';
    const topRecommendation = this.selectTopRecommendation(rawRecommendations);
    const topRecommendationId =
      topRecommendation && typeof topRecommendation.id === 'string'
        ? topRecommendation.id
        : '';
    const plantAsset = topRecommendationId
      ? plantAssetById.get(topRecommendationId)
      : null;
    const bestLocation = this.normalizeBestLocation(response.best_location);

    if (plantAsset?.storageKey && bestLocation) {
      try {
        const plantImageBuffer = await this.storageService.downloadFile(
          plantAsset.storageKey,
        );
        visualizedImage = await this.renderSpaceVisualization(
          imageBase64,
          plantImageBuffer.toString('base64'),
          bestLocation,
        );
      } catch (error) {
        console.error(
          '[Space Analysis] Không thể tạo visualization từ ảnh cây thật:',
          error,
        );
      }
    }

    return {
      success: response.success ?? true,
      analysis: response.analysis ?? null,
      recommendations,
      visualizedImage,
    };
  }
}
