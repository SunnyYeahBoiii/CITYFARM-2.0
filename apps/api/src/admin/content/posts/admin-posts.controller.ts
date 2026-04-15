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
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../../generated/prisma/client.js';
import { AdminPostsService } from './admin-posts.service';
import { AdminPostPatchDto } from './admin-posts.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/posts')
export class AdminPostsController {
  constructor(private readonly service: AdminPostsService) {}

  @Get()
  async list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.service.listPosts({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Patch(':postId')
  async patch(
    @Param('postId') postId: string,
    @Body() body: AdminPostPatchDto,
  ) {
    return this.service.patchPost(postId, body);
  }
}
