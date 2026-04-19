import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminOrdersService } from './orders/admin-orders.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  controllers: [AdminOrdersController, AdminUsersController],
  providers: [AdminOrdersService, AdminUsersService, RolesGuard],
})
export class AdminOperationsModule {}
