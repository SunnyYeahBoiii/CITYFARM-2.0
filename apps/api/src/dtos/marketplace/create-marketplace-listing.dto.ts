import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMarketplaceListingDto {
  @IsString()
  gardenPlantId: string;

  @IsString()
  product: string;

  @IsString()
  quantity: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  priceAmount: number; // in VND

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageAssetId?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO datetime

  @IsOptional()
  @IsString()
  pickupDistrict?: string;

  @IsOptional()
  @IsString()
  pickupWard?: string;
}
