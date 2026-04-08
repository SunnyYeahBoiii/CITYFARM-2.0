import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';
import { PostType } from '../../../generated/prisma/client.js';

export class CreatePostDto {
  @IsEnum(PostType)
  @IsNotEmpty()
  postType: PostType;

  @IsString()
  @IsNotEmpty()
  caption: string;

  @IsObject()
  @IsOptional()
  contentJson?: Record<string, any>;

  @IsUUID()
  @IsOptional()
  imageAssetId?: string;

  @IsUUID()
  @IsOptional()
  gardenPlantId?: string;

  @IsUUID()
  @IsOptional()
  listingId?: string;

  @IsString()
  @IsOptional()
  visibilityDistrict?: string;
}
