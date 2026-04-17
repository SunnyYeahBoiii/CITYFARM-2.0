import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Matches } from 'class-validator';

export enum ProductTypeDto {
  KIT = 'KIT',
  SEED = 'SEED',
  SOIL = 'SOIL',
  POT = 'POT',
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Product type is required' })
  productType: ProductTypeDto;

  @IsNotEmpty({ message: 'Product ID is required' })
  @IsString()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsNotEmpty({ message: 'Recipient name is required' })
  @IsString()
  recipientName: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Invalid Vietnamese phone number format' })
  recipientPhone: string;

  @IsNotEmpty({ message: 'Delivery address is required' })
  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @IsOptional()
  @IsString()
  deliveryDistrict?: string;

  @IsOptional()
  @IsString()
  deliveryWard?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}
