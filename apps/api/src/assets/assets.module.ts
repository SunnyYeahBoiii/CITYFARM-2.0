import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, SupabaseStorageService],
  exports: [AssetsService, SupabaseStorageService],
})
export class AssetsModule {}
