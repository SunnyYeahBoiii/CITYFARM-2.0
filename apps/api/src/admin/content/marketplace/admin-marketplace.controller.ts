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
import { AdminMarketplaceService } from './admin-marketplace.service';
import { AdminListingPatchDto } from './admin-marketplace.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/marketplace')
export class AdminMarketplaceController {
  constructor(private readonly service: AdminMarketplaceService) {}

  @Get()
  async list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.service.listListings({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Patch(':listingId')
  async patch(
    @Param('listingId') listingId: string,
    @Body() body: AdminListingPatchDto,
  ) {
    return this.service.patchListing(listingId, body);
  }
}
