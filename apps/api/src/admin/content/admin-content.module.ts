import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminPostsController } from './posts/admin-posts.controller';
import { AdminPostsService } from './posts/admin-posts.service';
import { AdminMarketplaceController } from './marketplace/admin-marketplace.controller';
import { AdminMarketplaceService } from './marketplace/admin-marketplace.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPostsController, AdminMarketplaceController],
  providers: [AdminPostsService, AdminMarketplaceService, RolesGuard],
})
export class AdminContentModule {}
