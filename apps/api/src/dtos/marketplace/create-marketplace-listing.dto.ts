import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMarketplaceListingDto {
  @IsString()
  gardenPlantId: string;

  @IsString()
  product: string;

  @IsString()
  quantity: string;

  @IsString()
  unit: string;

  @IsNumber()
  priceAmount: number;

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
