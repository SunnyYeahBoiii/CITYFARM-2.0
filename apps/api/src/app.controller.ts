import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

type ChatBody = {
  message?: string;
  plantId?: string;
  context?: unknown;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Mở cổng API Chat
  // @UseGuards(JwtAuthGuard) // Bắt buộc phải có Token đăng nhập mới được chat
  @Post('api/chat')
  async chatWithAI(@Body() body: ChatBody, @Req() _req: unknown) {
    void _req;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      throw new BadRequestException('Thiếu hoặc không hợp lệ trường message');
    }
    return this.appService.handleChatRequest('123', {
      message,
      plantId: typeof body.plantId === 'string' ? body.plantId : undefined,
      context: body.context,
    });
  }
}