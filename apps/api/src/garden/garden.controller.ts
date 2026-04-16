import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { GardenService } from './garden.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('garden')
@UseGuards(JwtAuthGuard)
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Get()
  async getMyGarden(@CurrentUser('id') userId: string) {
    return this.gardenService.getMyGarden(userId);
  }

  @Get(':plantId')
  async getPlantDetail(@CurrentUser('id') userId: string, @Param('plantId') plantId: string) {
    return this.gardenService.getPlantDetail(userId, plantId);
  }

  @Post('activate')
  async activateCode(@CurrentUser('id') userId: string, @Body('code') code: string) {
    return this.gardenService.activateCode(userId, code);
  }
}
