import { Module } from '@nestjs/common';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GardenController],
  providers: [GardenService],
  exports: [GardenService],
})
export class GardenModule {}
