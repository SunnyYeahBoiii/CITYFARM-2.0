import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ModelApiService } from './ai/model-api.service';
import { SupabaseStorageService } from './assets/supabase-storage.service';
import { ToolExecutorService } from './ai/tool-executor.service';
import { TOOL_DEFINITIONS, ToolCall } from './ai/tool-definitions';
import { deduplicateJournalUploadToolCalls } from './ai/journal-tool-call-dedupe';

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
  MediaAsset: {
    publicUrl: string;
    storageKey: string;
  } | null;
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
  placement_description?: string;
};

type SpaceVisualizationResponse = {
  success?: boolean;
  visualizedImage?: unknown;
};

type ParsedToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
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
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelApiService: ModelApiService,
    private readonly storageService: SupabaseStorageService,
    private readonly toolExecutorService: ToolExecutorService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  private stringifyForLog(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private extractJsonObjectFromText(
    text: string,
  ): Record<string, unknown> | null {
    const trimmed = text.trim();
    const candidates: string[] = [trimmed];

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      candidates.push(fencedMatch[1].trim());
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      candidates.push(trimmed.slice(firstBrace, lastBrace + 1).trim());
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private getParsedToolCalls(aiResponse: unknown): ParsedToolCall[] {
    if (!aiResponse || typeof aiResponse !== 'object') {
      return [];
    }

    if (
      'tool_calls' in aiResponse &&
      Array.isArray((aiResponse as Record<string, unknown>).tool_calls)
    ) {
      const directToolCalls = (aiResponse as Record<string, unknown>)
        .tool_calls as Array<Record<string, unknown>>;
      return directToolCalls
        .filter((entry) => typeof entry.name === 'string')
        .map((entry, index) => ({
          id:
            typeof entry.id === 'string' && entry.id.trim()
              ? entry.id
              : `tool-${index + 1}`,
          name: entry.name as string,
          arguments:
            entry.arguments && typeof entry.arguments === 'object'
              ? (entry.arguments as Record<string, unknown>)
              : {},
        }));
    }

    const reply = (aiResponse as Record<string, unknown>).reply;
    if (typeof reply !== 'string' || !reply.trim()) {
      return [];
    }

    const parsedReply = this.extractJsonObjectFromText(reply);
    if (!parsedReply || !Array.isArray(parsedReply.tool_calls)) {
      return [];
    }

    return parsedReply.tool_calls
      .filter((entry): entry is Record<string, unknown> => {
        if (!entry || typeof entry !== 'object') {
          return false;
        }
        const candidate = entry as Record<string, unknown>;
        return typeof candidate.name === 'string';
      })
      .map((entry, index) => ({
        id:
          typeof entry.id === 'string' && entry.id.trim()
            ? entry.id
            : `tool-${index + 1}`,
        name: entry.name as string,
        arguments:
          entry.arguments && typeof entry.arguments === 'object'
            ? (entry.arguments as Record<string, unknown>)
            : {},
      }));
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
      return this.modelApiService.getChatAdvice({
        message,
        context: ragContext,
      });
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

  async getConversationHistory(userId: string, plantId: string) {
    const conversation = await this.findOrCreateAIConversation(userId, plantId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return {
      conversationId: conversation.id,
      messages: messages.map((m) => ({
        id: m.id,
        role:
          m.senderType === 'USER' ? ('user' as const) : ('assistant' as const),
        content: m.body ?? '',
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async buildEnhancedPlantContext(plantId: string, userId: string) {
    const plant = (await this.prisma.gardenPlant.findUnique({
      where: { id: plantId, userId },
      include: {
        plantSpecies: {
          include: {
            careProfile: true,
          },
        },
        journalEntries: {
          orderBy: { capturedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            capturedAt: true,
            note: true,
            healthStatus: true,
            issueSummary: true,
            recommendationSummary: true,
            aiAnalysis: true,
            leafColorNote: true,
          },
        },
        careTasks: {
          where: { status: 'PENDING' },
          orderBy: { dueAt: 'asc' },
          take: 5,
          select: {
            id: true,
            taskType: true,
            title: true,
            dueAt: true,
            description: true,
          },
        },
      },
    })) as any;

    if (!plant) {
      return null;
    }

    return {
      species: {
        commonName: plant.plantSpecies.commonName,
        scientificName: plant.plantSpecies.scientificName,
        difficulty: plant.plantSpecies.difficulty,
        lightRequirement: plant.plantSpecies.lightRequirement,
        careGuide: plant.plantSpecies.careProfile?.sunlightSummary ?? null,
        wateringGuide: plant.plantSpecies.careProfile?.wateringSummary ?? null,
        pestsGuide: plant.plantSpecies.careProfile?.commonPests ?? null,
      },
      currentPlant: {
        nickname: plant.nickname,
        status: plant.status,
        health: plant.healthStatus,
        growthStage: plant.growthStage,
        daysGrowing: Math.floor(
          (Date.now() - plant.plantedAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
        zoneName: plant.zoneName,
        notes: plant.notes,
      },
      recentJournals: plant.journalEntries.map((j) => ({
        id: j.id,
        date: j.capturedAt.toISOString(),
        health: j.healthStatus,
        issue: j.issueSummary,
        recommendation: j.recommendationSummary,
        note: j.note,
        aiAnalysis: j.aiAnalysis,
        leafColor: j.leafColorNote,
      })),
      pendingTasks: plant.careTasks.map((t) => ({
        id: t.id,
        type: t.taskType,
        title: t.title,
        due: t.dueAt?.toISOString() ?? null,
        notes: t.description,
      })),
    };
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

    const aiResponse = await this.modelApiService.getChatAdvice(
      {
        message,
        context: ragContext,
        history: chatHistory,
        plantId,
      },
      TOOL_DEFINITIONS,
    );
    this.logger.log(
      `[Chatbot] Full first response for conversation ${conversation.id}: ${this.stringifyForLog(aiResponse)}`,
    );

    // Tool calling loop
    const rawToolCalls = this.getParsedToolCalls(aiResponse);
    if (rawToolCalls.length > 0) {
      this.logger.log(
        `[ToolCall] Received ${rawToolCalls.length} tool call(s) for conversation ${conversation.id}: ${this.stringifyForLog(rawToolCalls)}`,
      );

      // Execute each tool call
      const toolResults = await Promise.all(
        rawToolCalls.map(async (tc) => {
          const toolCall: ToolCall = {
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
          };
          return this.toolExecutorService.execute(toolCall, userId);
        }),
      );
      this.logger.log(
        `[ToolCall] Execution results for conversation ${conversation.id}: ${this.stringifyForLog(toolResults)}`,
      );

      // Send tool results back to AI for final response
      const finalResponse = await this.modelApiService.getChatAdvice({
        message,
        context: ragContext,
        history: chatHistory,
        plantId,
        tool_results: toolResults.map((tr) => ({
          tool_call_id: tr.toolCallId,
          name: rawToolCalls.find((tc) => tc.id === tr.toolCallId)?.name ?? '',
          success: tr.success,
          result: tr.result,
          error: tr.error,
        })),
      });
      this.logger.log(
        `[Chatbot] Full final response for conversation ${conversation.id}: ${this.stringifyForLog(finalResponse)}`,
      );

      // Update aiResponse with final reply
      if (
        typeof finalResponse === 'object' &&
        finalResponse !== null &&
        'reply' in finalResponse
      ) {
        (aiResponse as Record<string, unknown>).reply = (
          finalResponse as Record<string, unknown>
        ).reply;
      }
    }

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
      ...(typeof aiResponse === 'object' && aiResponse !== null
        ? aiResponse
        : {}),
      conversationId: conversation.id,
    };
  }

  /**
   * Journal-upload tool calling:
   * - Runs after `GardenService.logJournal()` has created the `PlantJournalEntry`.
   * - Executes care task mutations via tool execution so daily task history is appended.
   * - Supports multi-step tool calling (e.g. get_pending_tasks -> update/delete).
   */
  async processJournalUploadToolCalling(
    userId: string,
    plantId: string,
    journalEntry: {
      note?: string | null;
      healthStatus?: string | null;
      issueSummary?: string | null;
      recommendationSummary?: string | null;
      imageAssetId?: string | null;
    },
    dto?: { note?: string; imageAssetId?: string },
  ) {
    const journalImageAssetId =
      typeof (journalEntry?.imageAssetId ?? dto?.imageAssetId) === 'string'
        ? (journalEntry.imageAssetId ?? dto?.imageAssetId)!
        : undefined;

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
      this.logger.warn(
        `[JournalToolCalling] Plant not found or no access: plantId=${plantId} userId=${userId}`,
      );
      return;
    }

    // Prefetch PENDING tasks so the model can update/delete without needing
    // a multi-step tool loop.
    const pendingTasks = await this.prisma.careTask.findMany({
      where: { gardenPlantId: plantId, status: 'PENDING' },
      orderBy: { dueAt: 'asc' },
      select: {
        id: true,
        taskType: true,
        title: true,
        dueAt: true,
        description: true,
      },
    });

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
        health: journalEntry?.healthStatus ?? plantData.healthStatus,
        growthStage: plantData.growthStage,
        daysGrowing: Math.floor(
          (Date.now() - plantData.plantedAt.getTime()) / (1000 * 3600 * 24),
        ),
        zoneName: plantData.zoneName,
        notes: dto?.note ?? journalEntry?.note ?? plantData.notes,
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

    const healthStatus = (journalEntry?.healthStatus ?? 'UNKNOWN').toString();
    const issueSummary = journalEntry?.issueSummary ?? '';
    const recommendationSummary = journalEntry?.recommendationSummary ?? '';
    const userNote = dto?.note ?? journalEntry?.note ?? '';

    const pendingTasksText =
      pendingTasks.length > 0
        ? pendingTasks
            .map((t) => {
              const dueAtStr = t.dueAt?.toISOString() ?? 'null';
              const notes = t.description ?? '';
              return `- ${t.id} | taskType=${t.taskType} | title=${t.title} | dueAt=${dueAtStr} | notes=${notes}`;
            })
            .join('\n')
        : '- (không có task PENDING nào)';

    const message = `
Hệ thống đã phân tích ảnh journal vừa upload cho cây của bạn và tạo PlantJournalEntry.

[KẾT QUẢ PHÂN TÍCH TỪ ẢNH JOURNAL]
- healthStatus: ${healthStatus}
- issueSummary: ${issueSummary || 'Bình thường/không có ghi nhận'}
- recommendationSummary: ${recommendationSummary || '(không có)'}
- userNote: ${userNote || '(không có ghi chú)'}

[DANH SÁCH TASK ĐANG CHỜ (PENDING_TASKS)]
${pendingTasksText}

[NHIỆM VỤ]
Hãy điều chỉnh care tasks đang chờ (PENDING) dựa trên phân tích trên.

HƯỚNG DẪN BẮT BUỘC:
1) KHÔNG gọi get_pending_tasks. Hãy sử dụng danh sách PENDING_TASKS ở trên.
2) Nếu cần một loại task mới thì gọi create_care_task.
3) Nếu đã có task PENDING phù hợp thì gọi update_care_task để đổi lịch/tiêu đề/ghi chú (dùng đúng taskId).
4) Nếu phân tích cho thấy không cần thiết thì gọi delete_care_task (dùng đúng taskId).
5) KHÔNG gọi log_journal_entry (đã được ghi vào DB bởi endpoint journal upload).
6) Khi gọi create_care_task/update_care_task/delete_care_task, liên kết daily task history với đúng ảnh journal bằng journalImageAssetId (nếu có).

Trả về tool_calls JSON khi cần gọi tool.`;

    const aiResponse = await this.modelApiService.getChatAdvice(
      {
        mode: 'journal_upload',
        journalImageAssetId,
        message,
        context: ragContext,
        history: [],
        plantId,
      },
      TOOL_DEFINITIONS,
    );

    const rawToolCalls = this.getParsedToolCalls(aiResponse);
    const relevantToolCalls = deduplicateJournalUploadToolCalls(
      rawToolCalls.filter((tc) =>
        ['create_care_task', 'update_care_task', 'delete_care_task'].includes(
          tc.name,
        ),
      ),
    );

    await Promise.all(
      relevantToolCalls.map((tc) => {
        const toolCall: ToolCall = {
          id: tc.id,
          name: tc.name,
          arguments: { ...(tc.arguments ?? {}) },
        };

        // Phase 2: ensure the uploaded journal image is linked to the daily task history.
        if (journalImageAssetId) {
          toolCall.arguments.journalImageAssetId = journalImageAssetId;
        }

        return this.toolExecutorService.execute(toolCall, userId);
      }),
    );
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
        MediaAsset: {
          select: {
            publicUrl: true,
            storageKey: true,
          },
        },
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
    // Ưu tiên 1: Ảnh đại diện trực tiếp của loài cây (imageAssetId)
    if (plant.MediaAsset) {
      return {
        publicUrl: plant.MediaAsset.publicUrl,
        storageKey: plant.MediaAsset.storageKey,
      };
    }

    // Ưu tiên 2: Ảnh từ các sản phẩm liên quan (Hạt giống, v.v.)
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
      .map((p) =>
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
    placementDescription: string,
  ) {
    const response = (await this.modelApiService.renderSpaceVisualization({
      spaceImageBase64: spaceImageBase64,
      plantImageBase64: plantImageBase64,
      placementDescription: placementDescription,
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

    const recommendations = rawRecommendations.map((recommendation) => {
      const id = typeof recommendation.id === 'string' ? recommendation.id : '';
      const plantAsset = id ? plantAssetById.get(id) : null;
      return {
        ...recommendation,
        imageUrl:
          plantAsset?.publicUrl ??
          (typeof recommendation.imageUrl === 'string'
            ? recommendation.imageUrl
            : ''),
      };
    });

    let visualizedImage = '';
    const topRecommendation = this.selectTopRecommendation(rawRecommendations);
    const topRecommendationId =
      topRecommendation && typeof topRecommendation.id === 'string'
        ? topRecommendation.id
        : '';
    const plantAsset = topRecommendationId
      ? plantAssetById.get(topRecommendationId)
      : null;
    const placementDescription =
      response.placement_description ||
      'Đặt chậu cây tại vị trí phù hợp nhất trong phòng.';

    if (plantAsset?.storageKey) {
      try {
        const plantImageBuffer = await this.storageService.downloadFile(
          plantAsset.storageKey,
        );
        visualizedImage = await this.renderSpaceVisualization(
          imageBase64,
          plantImageBuffer.toString('base64'),
          placementDescription,
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
