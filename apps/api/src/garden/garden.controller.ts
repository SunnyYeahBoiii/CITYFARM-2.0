import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { GardenService } from './garden.service';
import { LogCareDto } from 'src/dtos/garden/log-care.dto';
import { LogJournalDto } from 'src/dtos/garden/log-journal.dto';
import { CreateCareTaskDto } from 'src/dtos/garden/create-care-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AppService } from 'src/app.service';

@Controller('garden')
@UseGuards(JwtAuthGuard)
export class GardenController {
  constructor(
    private readonly gardenService: GardenService,
    private readonly appService: AppService,
  ) {}

  @Get()
  async getMyGarden(@CurrentUser('id') userId: string) {
    return this.gardenService.getMyGarden(userId);
  }

  @Get('stats')
  async getGardenStats(@CurrentUser('id') userId: string) {
    return this.gardenService.getGardenStats(userId);
  }

  @Get('plants/:plantId/chat-context')
  async getChatContext(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
  ) {
    return this.appService.buildEnhancedPlantContext(plantId, userId);
  }

  @Get(':plantId')
  async getPlantDetail(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
  ) {
    return this.gardenService.getPlantDetail(userId, plantId);
  }

  @Post('activate')
  async activateCode(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ) {
    return this.gardenService.activateCode(userId, code);
  }

  @Post(':plantId/care')
  async logCare(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
    @Body() body: LogCareDto,
  ) {
    return this.gardenService.logCare(userId, plantId, body);
  }

  @Post(':plantId/journal')
  async logJournal(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
    @Body() body: LogJournalDto,
  ) {
    return this.gardenService.logJournal(userId, plantId, body);
  }

  @Post('plants/:plantId/tasks')
  async createTask(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
    @Body() body: CreateCareTaskDto,
  ) {
    return this.gardenService.createCareTask(userId, plantId, body);
  }

  @Delete(':plantId/journal/:journalId')
  async deleteJournal(
    @CurrentUser('id') userId: string,
    @Param('plantId') plantId: string,
    @Param('journalId') journalId: string,
  ) {
    return this.gardenService.deleteJournal(userId, plantId, journalId);
  }
}
