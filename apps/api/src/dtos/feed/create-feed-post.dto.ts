import { IsEnum, IsString, IsOptional, IsJSON } from 'class-validator';
import { PostType } from '../../../generated/prisma/enums';

export { PostType };

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
