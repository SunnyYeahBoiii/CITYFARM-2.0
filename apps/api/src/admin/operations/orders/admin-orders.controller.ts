import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../../generated/prisma/client.js';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { AdminOrderPatchDto } from './dto/admin-order-patch.dto';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  async list(@Query() query: AdminOrdersQueryDto) {
    return this.adminOrdersService.list(query);
  }

  @Patch(':orderId')
  async patch(
    @Param('orderId') orderId: string,
    @Body() body: AdminOrderPatchDto,
  ) {
    return this.adminOrdersService.patch(orderId, body);
  }
}
