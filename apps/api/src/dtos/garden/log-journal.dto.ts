import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PlantHealthStatus, PlantGrowthStage } from 'generated/prisma/enums';

export class LogJournalDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PlantHealthStatus)
  healthStatus?: PlantHealthStatus;

  @IsOptional()
  @IsEnum(PlantGrowthStage)
  growthStage?: PlantGrowthStage;

  @IsOptional()
  @IsString()
  leafColorNote?: string;

  @IsOptional()
  @IsString()
  issueSummary?: string;

  @IsOptional()
  @IsString()
  imageAssetId?: string;
}
