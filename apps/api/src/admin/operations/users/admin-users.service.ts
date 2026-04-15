import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  UserRole,
  VerificationStatus,
} from '../../../../generated/prisma/client.js';
import type { AdminUserPatchDto } from './dto/admin-user-patch.dto';

type AdminTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

type UserRow = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  district: string;
  city: string;
  createdAt: string;
  lastActiveAt: string;
  growerVerificationStatus: VerificationStatus;
  trustScore: number;
  riskSignals: string[];
  totals: {
    posts: number;
    listings: number;
    orders: number;
    gmv: string;
  };
};

type VerificationQueueItem = {
  userId: string;
  displayName: string;
  district: string;
  requestedAt: string;
  status: VerificationStatus;
  note: string;
};

type ActivityEvent = {
  time: string;
  tag: 'posts' | 'orders' | 'marketplace' | 'system';
  title: string;
  detail: string;
  tone: AdminTone;
};

type UsersSnapshot = {
  users: UserRow[];
  verificationQueue: VerificationQueueItem[];
  activitiesByUser: Record<string, ActivityEvent[]>;
};

function formatDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTime(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatRelative(from: Date, nowMs: number) {
  const diffMins = Math.max(0, Math.round((nowMs - from.getTime()) / 60000));
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeTrustScore(input: {
  role: UserRole;
  verification: VerificationStatus;
  cancelledOrders: number;
  listings: number;
  posts: number;
}): { score: number; riskSignals: string[] } {
  let score = 72;
  const signals: string[] = [];

  if (input.role === 'ADMIN') score = 99;
  if (input.role === 'EXPERT') score = Math.max(score, 90);
  if (input.role === 'SUPPLIER') score = Math.max(score, 84);

  if (input.verification === 'VERIFIED') score += 8;
  if (input.verification === 'PENDING') {
    score -= 6;
    signals.push('Verification pending');
  }
  if (input.verification === 'REVOKED') {
    score -= 30;
    signals.push('Revoked verification');
  }

  if (input.cancelledOrders >= 3) {
    score -= 10;
    signals.push('High cancellations (orders)');
  }

  if (input.listings >= 10 && input.verification !== 'VERIFIED') {
    score -= 8;
    signals.push('High volume (listings)');
  }

  if (input.posts >= 20 && input.verification === 'NONE') {
    signals.push('High activity (posts)');
  }

  return { score: clamp(score, 0, 100), riskSignals: signals };
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersSnapshot(): Promise<UsersSnapshot> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { profile: true },
    });

    const userIds = users.map((u) => u.id);
    const nowMs = Date.now();

    const [postCounts, listingCounts, orderAgg, cancelledAgg] =
      await Promise.all([
        this.prisma.feedPost.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds } },
          _count: { _all: true },
        }),
        this.prisma.marketplaceListing.groupBy({
          by: ['sellerId'],
          where: { sellerId: { in: userIds } },
          _count: { _all: true },
        }),
        this.prisma.order.groupBy({
          by: ['buyerId'],
          where: { buyerId: { in: userIds } },
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.order.groupBy({
          by: ['buyerId'],
          where: { buyerId: { in: userIds }, status: 'CANCELLED' },
          _count: { _all: true },
        }),
      ]);

    const postsByUser = new Map(
      postCounts.map((row) => [row.userId, row._count._all]),
    );
    const listingsByUser = new Map(
      listingCounts.map((row) => [row.sellerId, row._count._all]),
    );
    const ordersByUser = new Map(
      orderAgg.map((row) => [row.buyerId, row._count._all]),
    );
    const gmvByUser = new Map(
      orderAgg.map((row) => [row.buyerId, row._sum.totalAmount ?? 0]),
    );
    const cancelledByUser = new Map(
      cancelledAgg.map((row) => [row.buyerId, row._count._all]),
    );

    // Recent activities derived from real objects (no audit log exists yet).
    const [recentPosts, recentListings, recentOrders] = await Promise.all([
      this.prisma.feedPost.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        take: 250,
        select: { userId: true, createdAt: true, caption: true },
      }),
      this.prisma.marketplaceListing.findMany({
        where: { sellerId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        take: 250,
        select: { sellerId: true, createdAt: true, title: true, status: true },
      }),
      this.prisma.order.findMany({
        where: { buyerId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        take: 250,
        select: {
          buyerId: true,
          createdAt: true,
          orderCode: true,
          status: true,
        },
      }),
    ]);

    const activitiesByUser: Record<string, ActivityEvent[]> = {};
    const lastActivityMsByUser = new Map<string, number>();

    const pushEvent = (
      userId: string,
      event: ActivityEvent,
      timeMs: number,
    ) => {
      activitiesByUser[userId] ??= [];
      activitiesByUser[userId].push(event);
      const prev = lastActivityMsByUser.get(userId) ?? 0;
      if (timeMs > prev) lastActivityMsByUser.set(userId, timeMs);
    };

    for (const post of recentPosts) {
      if ((activitiesByUser[post.userId]?.length ?? 0) >= 3) continue;
      pushEvent(
        post.userId,
        {
          time: formatTime(post.createdAt),
          tag: 'posts',
          title: 'Created feed post',
          detail:
            post.caption.length > 90
              ? `${post.caption.slice(0, 90)}...`
              : post.caption,
          tone: 'neutral',
        },
        post.createdAt.getTime(),
      );
    }

    for (const listing of recentListings) {
      const count =
        activitiesByUser[listing.sellerId]?.filter(
          (e) => e.tag === 'marketplace',
        ).length ?? 0;
      if (count >= 2) continue;
      pushEvent(
        listing.sellerId,
        {
          time: formatTime(listing.createdAt),
          tag: 'marketplace',
          title: 'Created marketplace listing',
          detail: `${listing.title} (${listing.status})`,
          tone: listing.status === 'ACTIVE' ? 'success' : 'warning',
        },
        listing.createdAt.getTime(),
      );
    }

    for (const order of recentOrders) {
      const count =
        activitiesByUser[order.buyerId]?.filter((e) => e.tag === 'orders')
          .length ?? 0;
      if (count >= 2) continue;
      pushEvent(
        order.buyerId,
        {
          time: formatTime(order.createdAt),
          tag: 'orders',
          title: 'Placed order',
          detail: `${order.orderCode} (${order.status})`,
          tone:
            order.status === 'CANCELLED'
              ? 'danger'
              : order.status === 'PENDING_CONFIRMATION'
                ? 'warning'
                : 'neutral',
        },
        order.createdAt.getTime(),
      );
    }

    const userRows: UserRow[] = users.map((user) => {
      const displayName = user.profile?.displayName ?? user.email;
      const district = user.profile?.district ?? 'Unknown';
      const city = user.profile?.city ?? 'Unknown';
      const verification = user.profile?.growerVerificationStatus ?? 'NONE';

      const posts = postsByUser.get(user.id) ?? 0;
      const listings = listingsByUser.get(user.id) ?? 0;
      const orders = ordersByUser.get(user.id) ?? 0;
      const gmv = gmvByUser.get(user.id) ?? 0;
      const cancelledOrders = cancelledByUser.get(user.id) ?? 0;

      const trust = computeTrustScore({
        role: user.role,
        verification,
        cancelledOrders,
        listings,
        posts,
      });

      const lastMs =
        lastActivityMsByUser.get(user.id) ?? user.updatedAt.getTime();
      const lastActiveAt = formatRelative(new Date(lastMs), nowMs);

      return {
        id: user.id,
        displayName,
        email: user.email,
        role: user.role,
        district,
        city,
        createdAt: formatDateOnly(user.createdAt),
        lastActiveAt,
        growerVerificationStatus: verification,
        trustScore: trust.score,
        riskSignals: trust.riskSignals,
        totals: {
          posts,
          listings,
          orders,
          gmv: `₫${new Intl.NumberFormat('vi-VN').format(gmv)}`,
        },
      };
    });

    const verificationQueue: VerificationQueueItem[] = users
      .filter((u) => {
        const s = u.profile?.growerVerificationStatus;
        return s === 'PENDING' || s === 'REVOKED';
      })
      .map((u) => {
        const displayName = u.profile?.displayName ?? u.email;
        const district = u.profile?.district ?? 'Unknown';
        const status = u.profile?.growerVerificationStatus ?? 'NONE';
        const requestedAt = formatTime(u.profile?.updatedAt ?? u.updatedAt);
        const note =
          status === 'PENDING'
            ? 'Grower verification is pending.'
            : status === 'REVOKED'
              ? 'Grower verification has been revoked.'
              : '';

        return {
          userId: u.id,
          displayName,
          district,
          requestedAt,
          status,
          note,
        };
      });

    // Ensure activities are sorted by time desc per user and limited.
    for (const [userId, events] of Object.entries(activitiesByUser)) {
      events.sort((a, b) => b.time.localeCompare(a.time));
      activitiesByUser[userId] = events.slice(0, 5);
    }

    return { users: userRows, verificationQueue, activitiesByUser };
  }

  async patchUser(userId: string, body: AdminUserPatchDto): Promise<UserRow> {
    if (!body.role && !body.growerVerificationStatus) {
      throw new BadRequestException('No fields provided.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();

    if (body.role) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: body.role },
      });
    }

    if (body.growerVerificationStatus) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: existing.profile?.displayName ?? existing.email,
          bio: existing.profile?.bio ?? undefined,
          city: existing.profile?.city ?? undefined,
          district: existing.profile?.district ?? undefined,
          ward: existing.profile?.ward ?? undefined,
          growerVerificationStatus: body.growerVerificationStatus,
          verifiedGrowerAt:
            body.growerVerificationStatus === 'VERIFIED' ? now : null,
          totalHarvests: existing.profile?.totalHarvests ?? 0,
          totalCareLogs: existing.profile?.totalCareLogs ?? 0,
        },
        update: {
          growerVerificationStatus: body.growerVerificationStatus,
          verifiedGrowerAt:
            body.growerVerificationStatus === 'VERIFIED' ? now : null,
        },
      });
    }

    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    // Minimal re-map (for full snapshot fields, the frontend can refetch).
    const displayName = updated.profile?.displayName ?? updated.email;
    const district = updated.profile?.district ?? 'Unknown';
    const city = updated.profile?.city ?? 'Unknown';
    const verification = updated.profile?.growerVerificationStatus ?? 'NONE';

    const posts = await this.prisma.feedPost.count({ where: { userId } });
    const listings = await this.prisma.marketplaceListing.count({
      where: { sellerId: userId },
    });
    const orders = await this.prisma.order.count({
      where: { buyerId: userId },
    });
    const gmvAgg = await this.prisma.order.aggregate({
      where: { buyerId: userId },
      _sum: { totalAmount: true },
    });
    const cancelledOrders = await this.prisma.order.count({
      where: { buyerId: userId, status: 'CANCELLED' },
    });

    const trust = computeTrustScore({
      role: updated.role,
      verification,
      cancelledOrders,
      listings,
      posts,
    });

    return {
      id: updated.id,
      displayName,
      email: updated.email,
      role: updated.role,
      district,
      city,
      createdAt: formatDateOnly(updated.createdAt),
      lastActiveAt: formatRelative(updated.updatedAt, Date.now()),
      growerVerificationStatus: verification,
      trustScore: trust.score,
      riskSignals: trust.riskSignals,
      totals: {
        posts,
        listings,
        orders,
        gmv: `₫${new Intl.NumberFormat('vi-VN').format(gmvAgg._sum.totalAmount ?? 0)}`,
      },
    };
  }
}
