import { IsEnum, IsString, IsOptional, IsJSON } from 'class-validator';

export enum PostType {
  SHOWCASE = 'showcase',
  QUESTION = 'question',
  PLANT_SHARE = 'plant-share',
}

export class CreateFeedPostDto {
  @IsEnum(PostType)
  postType: PostType;

  @IsString()
  caption: string;

  @IsOptional()
  @IsString()
  gardenPlantId?: string;

  @IsOptional()
  @IsJSON()
  contentJson?: object;

  @IsOptional()
  @IsString()
  imageAssetId?: string;

  @IsOptional()
  @IsString()
  visibilityDistrict?: string;
}
