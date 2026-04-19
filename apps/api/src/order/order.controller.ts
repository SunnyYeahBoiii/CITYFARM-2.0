import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from '../dtos/order/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('history')
  async getHistory(@CurrentUser('id') userId: string) {
    return this.orderService.getMyOrders(userId);
  }
}
