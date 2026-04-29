import { Module, forwardRef } from '@nestjs/common';
import { ModelApiService } from './model-api.service';
import { ToolExecutorService } from './tool-executor.service';
import { GardenModule } from '../garden/garden.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => GardenModule), PrismaModule],
  providers: [ModelApiService, ToolExecutorService],
  exports: [ModelApiService, ToolExecutorService],
})
export class AiModule {}
