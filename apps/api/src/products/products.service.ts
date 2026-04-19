import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductType } from 'generated/prisma/enums';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProductsByType(type: ProductType) {
    const products = await this.prisma.product.findMany({
      where: {
        type,
        isActive: true,
      },
      include: {
        coverAsset: true,
        components: {
          select: {
            quantity: true,
            componentName: true,
            unit: true,
          }
        },
      },
    });

    return products.map((product) => {
      const priceFormatted = `${product.priceAmount.toLocaleString('vi-VN')}₫`;

      const base: any = {
        id: product.id,
        name: product.name,
        price: priceFormatted,
        priceAmount: product.priceAmount,
        sku: product.sku,
        slug: product.slug,
        description: product.description,
      };

      if (product.coverAsset) {
        base.image = product.coverAsset.publicUrl;
      }

      const metadata: any = product.metadata || {};

      switch (type) {
        case 'KIT':
          return {
            ...base,
            image: base.image || '/cityfarm/img/kit/standing.jpg',
            components: product.components.map(c => {
               return c.quantity > 1 ? `${c.quantity}x ${c.componentName}` : c.componentName;
            }),
            allowedSeeds: [],
          };
        case 'SEED':
          return {
            ...base,
            icon: this.getIconForSeed(product.slug),
          };
        case 'SOIL':
          return {
            ...base,
            quantity: metadata.volumeLiters ? `${metadata.volumeLiters}L` : '1kg',
          };
        case 'POT':
          return {
            ...base,
            size: metadata.volumeLiters ? `${metadata.volumeLiters}L` : metadata.diameterCm ? `${metadata.diameterCm}cm` : '1L',
            decoration: this.getDecorationForPot(product.slug),
          };
        default:
          return base;
      }
    });
  }

  private getIconForSeed(slug: string): string {
    if (slug.includes('tomato')) return '🍅';
    if (slug.includes('lettuce')) return '🥬';
    if (slug.includes('basil')) return '🌿';
    if (slug.includes('onion') || slug.includes('chive')) return '🧅';
    if (slug.includes('chili') || slug.includes('pepper')) return '🌶️';
    if (slug.includes('cucumber')) return '🥒';
    if (slug.includes('spinach') || slug.includes('kale') || slug.includes('bok-choy')) return '🥬';
    return '🌱';
  }

  private getDecorationForPot(slug: string): string {
    if (slug.includes('self-watering')) return '🌸';
    if (slug.includes('window')) return '🎨';
    if (slug.includes('trellis')) return '🌈';
    return '⭐';
  }
}
