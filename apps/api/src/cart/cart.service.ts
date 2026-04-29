import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from '../dtos/cart/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                priceAmount: true,
                currency: true,
                type: true,
                description: true,
                coverAsset: {
                  select: {
                    publicUrl: true,
                  },
                },
                components: {
                  select: {
                    id: true,
                    componentName: true,
                    quantity: true,
                    unit: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return this.formatCartResponse(cart);
  }

  private formatCartResponse(cart: any) {
    const items = cart.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      selectedComponentId: item.selectedComponentId,
      product: {
        id: item.product.id,
        name: item.product.name,
        priceAmount: item.product.priceAmount,
        currency: item.product.currency,
        type: item.product.type,
        description: item.product.description,
        image: item.product.coverAsset?.publicUrl || null,
        components: item.product.components || [],
      },
      unitPrice: item.product.priceAmount,
      totalPrice: item.product.priceAmount * item.quantity,
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal,
      currency: 'VND',
      itemCount: items.length,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    // Verify product exists and is active
    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found or not available`);
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    const quantity = dto.quantity ?? 1;

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        selectedComponentId: dto.selectedComponentId ?? null,
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Create new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity,
          selectedComponentId: dto.selectedComponentId,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    // Verify the item belongs to user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return null;
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }

  async validateCartItems(userId: string) {
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
      return { valid: false, errors: ['Cart is empty'] };
    }

    const errors: string[] = [];
    const validatedItems: any[] = [];

    for (const item of cart.items) {
      if (!item.product) {
        errors.push(`Product ${item.productId} no longer exists`);
        continue;
      }

      if (!item.product.isActive) {
        errors.push(`Product "${item.product.name}" is no longer available`);
        continue;
      }

      validatedItems.push({
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceAmount: item.product.priceAmount,
        totalPriceAmount: item.product.priceAmount * item.quantity,
        product: item.product,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      validatedItems,
      subtotal: validatedItems.reduce((sum, item) => sum + item.totalPriceAmount, 0),
    };
  }
}