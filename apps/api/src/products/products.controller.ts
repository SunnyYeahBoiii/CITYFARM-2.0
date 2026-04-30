import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductType } from 'generated/prisma/enums';

@Controller('shop/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(@Query('type') type: string) {
    if (!type) {
      throw new BadRequestException('Product type query parameter is required');
    }

    const upperType = type.toUpperCase();
    if (!Object.values(ProductType).includes(upperType as ProductType)) {
      throw new BadRequestException(
        `Invalid product type. Must be one of: ${Object.values(ProductType).join(', ')}`,
      );
    }

    return this.productsService.getProductsByType(upperType as ProductType);
  }
}
