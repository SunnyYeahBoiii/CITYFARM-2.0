import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ModelApiService } from './ai/model-api.service';

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
    coverAsset: {
      publicUrl: string;
    } | null;
  }>;
};

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modelApiService: ModelApiService,
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
          select: {
            coverAsset: {
              select: {
                publicUrl: true,
              },
            },
          },
          take: 1,
        },
      },
    });
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

  async analyzeSpace(file: Express.Multer.File, plantCatalogText?: string) {
    const plants = await this.getPlantCatalog();
    const catalog = plantCatalogText || this.buildPlantCatalogText(plants);
    const imageBase64 = file.buffer.toString('base64');

    const response = (await this.modelApiService.analyzeSpace({
      imageBase64,
      plantCatalogText: catalog,
    })) as {
      success?: boolean;
      analysis?: unknown;
      recommendations?: Array<Record<string, unknown>>;
      visualizedImage?: string;
    };

    const imageByPlantId = new Map(
      plants.map((plant) => [
        plant.id,
        plant.products[0]?.coverAsset?.publicUrl ?? null,
      ]),
    );

    const recommendations = (response.recommendations ?? []).map(
      (recommendation) => {
        const id =
          typeof recommendation.id === 'string' ? recommendation.id : '';
        return {
          ...recommendation,
          imageUrl:
            imageByPlantId.get(id) ??
            (typeof recommendation.imageUrl === 'string'
              ? recommendation.imageUrl
              : ''),
        };
      },
    );

    return {
      success: response.success ?? true,
      analysis: response.analysis ?? null,
      recommendations,
      visualizedImage:
        typeof response.visualizedImage === 'string'
          ? response.visualizedImage
          : '',
    };
  }
}
