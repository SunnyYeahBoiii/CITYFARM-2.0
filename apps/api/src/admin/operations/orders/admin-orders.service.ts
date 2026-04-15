import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderStatus } from '../../../../generated/prisma/client.js';
import type { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import type { AdminOrderPatchDto } from './dto/admin-order-patch.dto';

type AdminOrderTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

type AdminOrder = {
  id: string;
  code: string;
  createdAt: string;
  buyer: { name: string; phone: string };
  delivery: {
    city: string;
    district?: string;
    address?: string;
    note?: string;
  };
  paymentMethod: 'CASH_ON_PICKUP' | 'CASH_ON_DELIVERY' | 'UNPAID';
  status: OrderStatus;
  currency: 'VND';
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  customerNote?: string;
  internalNote?: string;
  lines: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPriceAmount: number;
    totalPriceAmount: number;
  }>;
  flags: Array<{
    id: string;
    label: string;
    tone: AdminOrderTone;
    description?: string;
  }>;
  timeline: Array<{
    id: string;
    at: string;
    title: string;
    description: string;
    tone: AdminOrderTone;
  }>;
};

function minutesBetween(from: Date, toMs: number) {
  const fromMs = from.getTime();
  return Math.max(0, Math.round((toMs - fromMs) / 60000));
}

function buildTimeline(order: {
  createdAt: Date;
  confirmedAt: Date | null;
  readyForPickupAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}) {
  const events: AdminOrder['timeline'] = [
    {
      id: 'created',
      at: order.createdAt.toISOString(),
      title: 'Order created',
      description: 'Order was created in the system.',
      tone: 'neutral',
    },
  ];

  if (order.confirmedAt) {
    events.push({
      id: 'confirmed',
      at: order.confirmedAt.toISOString(),
      title: 'Order confirmed',
      description: 'Order was confirmed by an operator.',
      tone: 'success',
    });
  }

  if (order.readyForPickupAt) {
    events.push({
      id: 'ready',
      at: order.readyForPickupAt.toISOString(),
      title: 'Ready for pickup',
      description: 'Order is ready for pickup.',
      tone: 'info',
    });
  }

  if (order.completedAt) {
    events.push({
      id: 'completed',
      at: order.completedAt.toISOString(),
      title: 'Completed',
      description: 'Order has been completed.',
      tone: 'neutral',
    });
  }

  if (order.cancelledAt) {
    events.push({
      id: 'cancelled',
      at: order.cancelledAt.toISOString(),
      title: 'Cancelled',
      description: 'Order was cancelled.',
      tone: 'danger',
    });
  }

  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminOrdersQueryDto): Promise<AdminOrder[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.district) where.deliveryDistrict = query.district;

    // Lightweight search (orderCode, recipientPhone, recipientName).
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { orderCode: { contains: q, mode: 'insensitive' } },
        { recipientPhone: { contains: q, mode: 'insensitive' } },
        { recipientName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        buyer: { include: { profile: true } },
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const nowMs = Date.now();

    return orders.map((order) => {
      const createdAtIso = order.createdAt.toISOString();

      const flags: AdminOrder['flags'] = [];
      if (order.status === 'PENDING_CONFIRMATION') {
        const mins = minutesBetween(order.createdAt, nowMs);
        if (mins > 45) {
          flags.push({
            id: 'sla_overdue',
            label: 'SLA overdue',
            tone: 'warning',
            description: `Pending confirmation for ${mins} minutes.`,
          });
        }
      }

      if (
        !order.deliveryAddress ||
        !order.recipientPhone ||
        !order.recipientName
      ) {
        flags.push({
          id: 'incomplete_delivery',
          label: 'Missing delivery',
          tone: 'info',
          description: 'Delivery address or recipient info is incomplete.',
        });
      }

      const buyerName = order.buyer.profile?.displayName || order.buyer.email;

      return {
        id: order.id,
        code: order.orderCode,
        createdAt: createdAtIso,
        buyer: {
          name: buyerName,
          phone: order.recipientPhone ?? '',
        },
        delivery: {
          city: order.deliveryCity ?? order.pickupCity ?? 'Ho Chi Minh City',
          district: order.deliveryDistrict ?? undefined,
          address: order.deliveryAddress ?? undefined,
          note: order.pickupAddressNote ?? undefined,
        },
        paymentMethod: order.paymentMethod,
        status: order.status,
        currency: 'VND',
        subtotalAmount: order.subtotalAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        customerNote: order.customerNote ?? undefined,
        internalNote: undefined,
        lines: order.items.map((item) => ({
          sku: item.product.sku,
          name: item.product.name,
          quantity: item.quantity,
          unitPriceAmount: item.unitPriceAmount,
          totalPriceAmount: item.totalPriceAmount,
        })),
        flags,
        timeline: buildTimeline(order),
      };
    });
  }

  async patch(orderId: string, body: AdminOrderPatchDto): Promise<AdminOrder> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { include: { profile: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (body.internalNote?.trim()) {
      // Schema does not currently have a dedicated internal note field for orders.
      throw new BadRequestException(
        'internalNote is not supported by current schema.',
      );
    }

    const now = new Date();

    const update: any = {
      status: body.status,
    };

    if (body.status === 'CONFIRMED' && !order.confirmedAt) {
      update.confirmedAt = now;
    }

    if (body.status === 'READY_FOR_PICKUP' && !order.readyForPickupAt) {
      update.readyForPickupAt = now;
    }

    if (body.status === 'COMPLETED' && !order.completedAt) {
      update.completedAt = now;
    }

    if (body.status === 'CANCELLED' && !order.cancelledAt) {
      update.cancelledAt = now;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: update,
      include: {
        buyer: { include: { profile: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });

    const buyerName = updated.buyer.profile?.displayName || updated.buyer.email;

    return {
      id: updated.id,
      code: updated.orderCode,
      createdAt: updated.createdAt.toISOString(),
      buyer: {
        name: buyerName,
        phone: updated.recipientPhone ?? '',
      },
      delivery: {
        city: updated.deliveryCity ?? updated.pickupCity ?? 'Ho Chi Minh City',
        district: updated.deliveryDistrict ?? undefined,
        address: updated.deliveryAddress ?? undefined,
        note: updated.pickupAddressNote ?? undefined,
      },
      paymentMethod: updated.paymentMethod,
      status: updated.status,
      currency: 'VND',
      subtotalAmount: updated.subtotalAmount,
      discountAmount: updated.discountAmount,
      totalAmount: updated.totalAmount,
      customerNote: updated.customerNote ?? undefined,
      internalNote: undefined,
      lines: updated.items.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        unitPriceAmount: item.unitPriceAmount,
        totalPriceAmount: item.totalPriceAmount,
      })),
      flags: [],
      timeline: buildTimeline(updated),
    };
  }
}
