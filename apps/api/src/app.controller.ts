import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Import Guard bảo vệ

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Mở cổng API Chat
  @UseGuards(JwtAuthGuard) // Bắt buộc phải có Token đăng nhập mới được chat
  @Post('api/chat')
  async chatWithAI(@Body() body: { plantId: string; message: string }, @Req() req: any) {
    const userId = req.user.id; // Lấy ID của user từ JWT Token
    return this.appService.processChatRequest(userId, body.plantId, body.message);
  }
}