import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreateCareTaskDto {
  @IsEnum([
    'WATERING',
    'FERTILIZING',
    'PRUNING',
    'ROTATING',
    'PEST_CHECK',
    'HARVEST',
    'CUSTOM',
  ])
  taskType: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
