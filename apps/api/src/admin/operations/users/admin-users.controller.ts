import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../../generated/prisma/client.js';
import { AdminUsersService } from './admin-users.service';
import { AdminUserPatchDto } from './dto/admin-user-patch.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async getUsersSnapshot() {
    return this.adminUsersService.getUsersSnapshot();
  }

  @Patch(':userId')
  async patch(
    @Param('userId') userId: string,
    @Body() body: AdminUserPatchDto,
  ) {
    return this.adminUsersService.patchUser(userId, body);
  }
}
