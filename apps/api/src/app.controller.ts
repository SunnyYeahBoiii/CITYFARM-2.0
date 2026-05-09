import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppReadinessService } from './app-readiness.service';
import { AppService } from './app.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthService } from './auth/auth.service';

type ChatBody = {
  message?: string;
  plantId?: string;
  context?: unknown;
};

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appReadinessService: AppReadinessService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) res?: Response) {
    const readiness = await this.appReadinessService.getReadiness();
    if (!readiness.ready) {
      res?.status(503);
    }
    return readiness;
  }

  // Mở cổng API Chat
  // @UseGuards(JwtAuthGuard) // Bắt buộc phải có Token đăng nhập mới được chat
  // Dual paths: canonical `/api/chat`, and `/chat` when nginx uses `proxy_pass .../api/` (strips prefix).
  @Post(['api/chat', 'chat'])
  async chatWithAI(@Body() body: ChatBody, @Req() req: Request) {
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      throw new BadRequestException('Thiếu hoặc không hợp lệ trường message');
    }

    const guardUser = req.user as { sub?: unknown; id?: unknown } | undefined;
    const guardUserId =
      typeof guardUser?.sub === 'string'
        ? guardUser.sub
        : typeof guardUser?.id === 'string'
          ? guardUser.id
          : null;
    const forwardedUserId =
      typeof req.headers['x-cityfarm-user-id'] === 'string'
        ? req.headers['x-cityfarm-user-id']
        : null;
    const cookieUserId = await this.authService.extractUserIdFromCookies(req);
    const chatUserId =
      guardUserId ??
      forwardedUserId ??
      cookieUserId ??
      `guest:${req.ip || 'unknown'}`;

    const response: unknown = await this.appService.handleChatRequest(
      chatUserId,
      {
        message,
        plantId: typeof body.plantId === 'string' ? body.plantId : undefined,
        context: body.context,
      },
    );
    return response;
  }

  @Get(['api/plants/catalog', 'plants/catalog'])
  async getPlantCatalog() {
    return this.appService.getPlantCatalog();
  }

  @Get(['api/chat/conversation/:plantId', 'chat/conversation/:plantId'])
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
  ) {
    return this.appService.getConversationHistory(userId, plantId);
  }

  @Get(['api/chat/plants/:plantId/context', 'chat/plants/:plantId/context'])
  @UseGuards(JwtAuthGuard)
  async getChatContext(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
  ) {
    const context = await this.appService.buildEnhancedPlantContext(
      plantId,
      userId,
    );
    if (!context) {
      throw new BadRequestException(
        'Không tìm thấy cây hoặc không có quyền truy cập',
      );
    }
    return context;
  }

  @Post(['api/scan/analyze', 'scan/analyze'])
  @UseGuards(JwtAuthGuard) // Bật dòng này lên nếu bạn muốn bắt buộc phải đăng nhập mới được scan
  @UseInterceptors(FileInterceptor('file'))
  async analyzeSpace(
    @UploadedFile() file: Express.Multer.File,
    @Body('plantCatalogText') plantCatalogText?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Thiếu file ảnh để phân tích');
    }
    return this.appService.analyzeSpace(file, plantCatalogText);
  }
}
