import { Module } from '@nestjs/common';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [PrismaModule, AiModule, AssetsModule],
  controllers: [GardenController],
  providers: [GardenService],
  exports: [GardenService],
})
export class GardenModule {}
