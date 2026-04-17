import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../dtos/order/create-order.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  private generateOrderCode(): string {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  }

  private generateActivationCode(): string {
    return `CITY-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        type: dto.productType as 'KIT' | 'SEED' | 'SOIL' | 'POT',
        isActive: true,
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product "${dto.productId}" of type "${dto.productType}" not found`,
      );
    }

    const quantity = dto.quantity ?? 1;
    const totalAmount = product.priceAmount * quantity;
    const orderCode = this.generateOrderCode();

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          orderCode,
          totalAmount,
          subtotalAmount: totalAmount,
          currency: 'VND',
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          deliveryAddress: dto.deliveryAddress,
          deliveryCity: dto.deliveryCity ?? 'Ho Chi Minh City',
          deliveryDistrict: dto.deliveryDistrict,
          deliveryWard: dto.deliveryWard,
          customerNote: dto.customerNote,
          items: {
            create: {
              productId: product.id,
              quantity,
              unitPriceAmount: product.priceAmount,
              totalPriceAmount: totalAmount,
            },
          },
        },
        include: {
          items: true,
        },
      });

      const orderItem = order.items[0];
      let activationCode: string | null = null;

      // Generate activation code for Kits and Seeds (Legacy feature)
      if (product.type === 'KIT' || product.type === 'SEED') {
        const codeRecord = await tx.kitActivationCode.create({
          data: {
            code: this.generateActivationCode(),
            orderItemId: orderItem.id,
            productId: product.id,
          },
        });
        activationCode = codeRecord.code;
      }

      return {
        id: order.id,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        activationCode,
        items: [
          {
            product: {
              id: product.id,
              name: product.name,
              type: product.type,
              priceAmount: product.priceAmount,
            },
            quantity,
            unitPrice: product.priceAmount,
            totalPrice: totalAmount,
          },
        ],
      };
    });
  }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                type: true,
                priceAmount: true,
                metadata: true,
              },
            },
            activationCodes: {
              select: {
                code: true,
                redeemedAt: true,
              },
            },
          },
        },
      },
    });

    return orders.map((order) => {
      // Find the first activation code in any item (usually orders are single-item for now)
      const activationCode = order.items.find((i) => i.activationCodes.length > 0)
        ?.activationCodes[0]?.code;

      return {
        ...order,
        activationCode,
      };
    });
  }
}
