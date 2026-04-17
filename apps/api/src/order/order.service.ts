import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, ProductTypeDto } from '../dtos/order/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

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
    const orderCode = `${dto.productType}-${dto.productId}-${Date.now().toString().slice(-6)}`;

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
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  priceAmount: true,
                },
              },
            },
          },
        },
      });

      return {
        id: order.id,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPriceAmount,
          totalPrice: item.totalPriceAmount,
        })),
      };
    });
  }
}
