import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Định nghĩa Endpoint POST /chat để Frontend gọi tới
  @Post('chat')
  async handleChat(@Body() body: any) {
    // Nhận payload từ Frontend và chuyển thẳng cho Service xử lý
    return this.appService.getAIAdvice(body);
  }
}