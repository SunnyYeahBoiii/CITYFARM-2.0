import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType } from '../../../generated/prisma/client.js';

export class FeedFilterDto {
  @IsEnum(PostType)
  @IsOptional()
  postType?: PostType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  cursor?: string;
}
