import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

type ChatBody = {
  message?: string;
  plantId?: string;
  context?: unknown;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Mở cổng API Chat
  // @UseGuards(JwtAuthGuard) // Bắt buộc phải có Token đăng nhập mới được chat
  @Post('api/chat')
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
    const chatUserId = guardUserId ?? forwardedUserId ?? `guest:${req.ip || 'unknown'}`;

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

  @Get('api/plants/catalog')
  async getPlantCatalog() {
    return this.appService.getPlantCatalog();
  }

  @Post('api/scan/analyze')
  // @UseGuards(JwtAuthGuard) // Bật dòng này lên nếu bạn muốn bắt buộc phải đăng nhập mới được scan
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
