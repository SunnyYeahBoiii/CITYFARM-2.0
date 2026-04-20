import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateMarketplaceListingDto {
  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  quantity?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  priceAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageAssetId?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
