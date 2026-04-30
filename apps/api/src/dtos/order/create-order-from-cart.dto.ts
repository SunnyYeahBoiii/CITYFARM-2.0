import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrderFromCartDto {
  @IsNotEmpty({ message: 'Recipient name is required' })
  @IsString()
  recipientName: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
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
