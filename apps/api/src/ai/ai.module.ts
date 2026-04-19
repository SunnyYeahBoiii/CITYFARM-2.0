import { Module } from '@nestjs/common';
import { ModelApiService } from './model-api.service';

@Module({
  providers: [ModelApiService],
  exports: [ModelApiService],
})
export class AiModule {}
