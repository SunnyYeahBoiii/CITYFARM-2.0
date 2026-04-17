import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shop/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('buy-now')
  async buyNow(@Req() req: any, @Body('productId') productId: string) {
    const userId = req.user.id || req.user.sub;
    return this.ordersService.createSingleItemOrder(userId, productId);
  }

  @Get('my-orders')
  async getMyOrders(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.ordersService.getMyOrders(userId);
  }
}
