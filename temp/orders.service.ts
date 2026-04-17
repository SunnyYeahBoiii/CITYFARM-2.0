import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, ProductType, PaymentMethod } from 'generated/prisma/enums';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderCode(): string {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  }

  private generateActivationCode(): string {
    return `CITY-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  }

  async createSingleItemOrder(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }

    const order = await this.prisma.order.create({
      data: {
        buyerId: userId,
        status: OrderStatus.CONFIRMED,
        orderCode: this.generateOrderCode(),
        subtotalAmount: product.priceAmount,
        totalAmount: product.priceAmount,
        confirmedAt: new Date(),
        paymentMethod: PaymentMethod.CASH_ON_PICKUP,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitPriceAmount: product.priceAmount,
            totalPriceAmount: product.priceAmount,
          },
        },
      },
      include: {
        items: true,
      },
    });

    const orderItem = order.items[0];
    let activationCode: string | null = null;

    if (product.type === ProductType.KIT || product.type === ProductType.SEED) {
      const codeRecord = await this.prisma.kitActivationCode.create({
        data: {
          code: this.generateActivationCode(),
          orderItemId: orderItem.id,
          productId: product.id,
        },
      });
      activationCode = codeRecord.code;
    }

    return {
      order,
      activationCode,
    };
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            activationCodes: true,
          },
        },
      },
    });
  }
}
