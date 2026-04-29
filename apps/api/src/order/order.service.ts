import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../dtos/order/create-order.dto';
import { CreateOrderFromCartDto } from '../dtos/order/create-order-from-cart.dto';
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

  async createOrderFromCart(userId: string, dto: CreateOrderFromCartDto) {
    // Get user's cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate all products
    const validatedItems: any[] = [];
    for (const item of cart.items) {
      if (!item.product) {
        throw new NotFoundException(`Product ${item.productId} no longer exists`);
      }
      if (!item.product.isActive) {
        throw new BadRequestException(`Product "${item.product.name}" is no longer available`);
      }
      validatedItems.push({
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceAmount: item.product.priceAmount,
        totalPriceAmount: item.product.priceAmount * item.quantity,
        product: item.product,
      });
    }

    const subtotalAmount = validatedItems.reduce((sum, item) => sum + item.totalPriceAmount, 0);
    const totalAmount = subtotalAmount;
    const orderCode = this.generateOrderCode();

    return this.prisma.$transaction(async (tx) => {
      // Create order with all items
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          orderCode,
          totalAmount,
          subtotalAmount,
          currency: 'VND',
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          deliveryAddress: dto.deliveryAddress,
          deliveryCity: dto.deliveryCity ?? 'Ho Chi Minh City',
          deliveryDistrict: dto.deliveryDistrict,
          deliveryWard: dto.deliveryWard,
          customerNote: dto.customerNote,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceAmount: item.unitPriceAmount,
              totalPriceAmount: item.totalPriceAmount,
            })),
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
              activationCodes: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      });

      // Generate activation codes for KIT and SEED products
      const activationCodes: string[] = [];
      for (const orderItem of order.items) {
        if (orderItem.product.type === 'KIT' || orderItem.product.type === 'SEED') {
          const codeRecord = await tx.kitActivationCode.create({
            data: {
              code: this.generateActivationCode(),
              orderItemId: orderItem.id,
              productId: orderItem.productId,
            },
          });
          activationCodes.push(codeRecord.code);
        }
      }

      // Clear the cart after successful order
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return {
        id: order.id,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
        subtotalAmount: order.subtotalAmount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        activationCodes,
        items: order.items.map((item) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            type: item.product.type,
            priceAmount: item.product.priceAmount,
          },
          quantity: item.quantity,
          unitPrice: item.unitPriceAmount,
          totalPrice: item.totalPriceAmount,
        })),
      };
    });
  }
}
