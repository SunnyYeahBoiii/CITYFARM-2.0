import { Module, forwardRef } from '@nestjs/common';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AssetsModule } from '../assets/assets.module';
import { AppModule } from '../app.module';

@Module({
  imports: [PrismaModule, AiModule, AssetsModule, forwardRef(() => AppModule)],
  controllers: [GardenController],
  providers: [GardenService],
  exports: [GardenService],
})
export class GardenModule {}
