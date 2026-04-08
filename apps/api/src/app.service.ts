import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  // Inject PrismaService để tương tác với Database
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Hàm gọi Python được đổi thành private vì nó chỉ phục vụ nội bộ file này
  private async getAIAdvice(payload: any) {
    try {
      const response = await fetch("http://model-api:3002/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error: any) {
      console.error("Lỗi khi gọi Python Model API:", error);
      return { success: false, error: "Cannot connect to AI Model" };
    }
  }

  // Hàm chính xử lý nghiệp vụ Chat RAG
  async processChatRequest(userId: string, plantId: string, message: string) {
    // 1. Dùng Prisma lấy toàn bộ RAG Context từ Database
    const plantData = await this.prisma.gardenPlant.findUnique({
      where: { id: plantId, userId: userId }, // Đảm bảo cây này thuộc về user đang chat
      include: {
        user: { include: { profile: true } },
        plantSpecies: { include: { careProfile: true } },
        careTasks: {
          where: { status: { in: ['COMPLETED', 'SKIPPED'] } },
          orderBy: { completedAt: 'desc' },
          take: 3, // Lấy 3 lịch sử chăm sóc gần nhất
        },
        journalEntries: {
          orderBy: { capturedAt: 'desc' },
          take: 2, // Lấy 2 ảnh/nhật ký gần nhất
        },
      },
    });

    if (!plantData) {
      throw new NotFoundException('Không tìm thấy cây này trong vườn của bạn!');
    }

    // 2. Đóng gói Payload RAG siêu cấp
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
        }
      },
      currentPlant: {
        nickname: plantData.nickname,
        status: plantData.status,
        health: plantData.healthStatus,
        growthStage: plantData.growthStage,
        daysGrowing: Math.floor((Date.now() - plantData.plantedAt.getTime()) / (1000 * 3600 * 24)),
        zoneName: plantData.zoneName,
        notes: plantData.notes,
      },
      history: {
        recentTasks: plantData.careTasks.map(t => `${t.taskType} - ${t.completedAt?.toISOString().split('T')[0]}`),
        recentJournals: plantData.journalEntries.map(j => `Sức khỏe: ${j.healthStatus} - Ghi chú: ${j.issueSummary || 'Bình thường'}`)
      }
    };

    const pythonPayload = {
      message: message,
      context: ragContext
    };

    // 3. Gửi sang Python và nhận kết quả
    const aiResponse = await this.getAIAdvice(pythonPayload);

    // TODO sau này: Code lưu lịch sử chat vào bảng Conversation/Message

    return aiResponse;
  }
}