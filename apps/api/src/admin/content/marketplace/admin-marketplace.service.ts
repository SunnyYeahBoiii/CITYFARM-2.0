import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ListingStatus,
  MarketplaceListingAdmin,
  type ListingQuality,
} from './admin-marketplace.types';
import type {
  AdminListingPatchDto,
  AdminListingStatus,
  AdminListingVerificationStatus,
} from './admin-marketplace.dto';
import {
  type Prisma,
  ListingStatus as DbListingStatus,
  VerificationStatus as DbVerificationStatus,
} from '../../../../generated/prisma/client.js';

type ListingWithAdminDeps = Prisma.MarketplaceListingGetPayload<{
  include: {
    imageAsset: { select: { publicUrl: true } };
    seller: {
      select: {
        id: true;
        email: true;
        profile: {
          select: {
            displayName: true;
            district: true;
            growerVerificationStatus: true;
          };
        };
      };
    };
  };
}>;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatVnd(amount: number): string {
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return `₫${formatted}`;
}

function formatRelativeDayLabel(expiresAt: Date | null): string {
  if (!expiresAt) return 'No expiry';
  const ms = expiresAt.getTime() - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'In 1 day';
  if (days <= 7) return `In ${days} days`;
  return expiresAt.toLocaleDateString('vi-VN');
}

function formatShortDateTime(date: Date): string {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function sellerName(user: {
  email: string;
  profile?: { displayName?: string | null } | null;
}): string {
  return user.profile?.displayName?.trim() || user.email.split('@')[0];
}

function sellerDistrict(user: {
  profile?: { district?: string | null } | null;
}): string {
  return user.profile?.district?.trim() || 'Unknown';
}

function sellerVerifiedGrower(user: {
  profile?: { growerVerificationStatus?: string | null } | null;
}): boolean {
  return user.profile?.growerVerificationStatus === 'VERIFIED';
}

function mapDbStatusToAdmin(dbStatus: DbListingStatus): ListingStatus {
  if (dbStatus === 'CANCELLED') return 'HIDDEN';
  if (dbStatus === 'RESERVED') return 'ACTIVE';
  if (dbStatus === 'DRAFT') return 'DRAFT';
  if (dbStatus === 'ACTIVE') return 'ACTIVE';
  if (dbStatus === 'SOLD') return 'SOLD';
  if (dbStatus === 'EXPIRED') return 'EXPIRED';
  // Fallback: treat unknown as ACTIVE.
  return 'ACTIVE';
}

function mapAdminStatusToDb(status: AdminListingStatus): DbListingStatus {
  const map: Record<AdminListingStatus, DbListingStatus> = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    SOLD: 'SOLD',
    EXPIRED: 'EXPIRED',
    HIDDEN: 'CANCELLED',
  };
  return map[status];
}

function mapAdminVerificationToDb(
  status: AdminListingVerificationStatus,
): DbVerificationStatus {
  const map: Record<AdminListingVerificationStatus, DbVerificationStatus> = {
    NONE: 'NONE',
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    REVOKED: 'REVOKED',
  };
  return map[status];
}

@Injectable()
export class AdminMarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  private deriveQuality(
    listing: Pick<
      ListingWithAdminDeps,
      | 'description'
      | 'documentedDays'
      | 'imageAssetId'
      | 'verificationStatus'
      | 'status'
    >,
  ): ListingQuality {
    const descriptionLen = (listing.description ?? '').trim().length;
    const photoScore = listing.imageAssetId ? 85 : 40;
    const descriptionScore =
      descriptionLen >= 180
        ? 88
        : descriptionLen >= 80
          ? 72
          : descriptionLen >= 20
            ? 55
            : 35;
    const documentationScore = clampScore(
      Math.min(100, listing.documentedDays * 10),
    );

    let flags = 0;
    if (!listing.imageAssetId) flags += 1;
    if (descriptionLen < 40) flags += 1;
    if (listing.verificationStatus === 'REVOKED') flags += 2;
    if (listing.status === 'CANCELLED') flags += 1;

    return {
      photoScore: clampScore(photoScore),
      descriptionScore: clampScore(descriptionScore),
      documentationScore: clampScore(documentationScore),
      flags,
    };
  }

  private mapToAdmin(listing: ListingWithAdminDeps): MarketplaceListingAdmin {
    const quality = this.deriveQuality(listing);
    const notes: string[] = [];

    if (listing.status === 'RESERVED') {
      notes.push('DB status: RESERVED');
    }
    if (listing.pickupNote) {
      notes.push(listing.pickupNote);
    }

    return {
      id: listing.id,
      title: listing.title,
      productLabel: listing.title,
      seller: {
        id: listing.sellerId,
        name: sellerName(listing.seller),
        verifiedGrower: sellerVerifiedGrower(listing.seller),
        district: sellerDistrict(listing.seller),
      },
      pickupDistrict: listing.pickupDistrict,
      pickupCity: listing.pickupCity,
      quantityText: `${listing.quantity.toString()} ${listing.unit}`,
      priceText: formatVnd(listing.priceAmount),
      createdAtLabel: formatShortDateTime(listing.createdAt),
      expiresAtLabel: formatRelativeDayLabel(listing.expiresAt ?? null),
      status: mapDbStatusToAdmin(listing.status),
      verificationStatus: listing.verificationStatus,
      documentedDays: listing.documentedDays,
      imageUrl: listing.imageAsset?.publicUrl ?? undefined,
      notes: notes.length ? notes.join(' • ') : undefined,
      quality,
    };
  }

  async listListings(params?: {
    limit?: number;
  }): Promise<MarketplaceListingAdmin[]> {
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);

    const listings = await this.prisma.marketplaceListing.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        imageAsset: { select: { publicUrl: true } },
        seller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
              },
            },
          },
        },
      },
    });

    return listings.map((listing) => this.mapToAdmin(listing));
  }

  async patchListing(
    listingId: string,
    dto: AdminListingPatchDto,
  ): Promise<MarketplaceListingAdmin> {
    const note = dto.note?.trim();
    if (note) {
      throw new BadRequestException(
        'note is not supported yet (no persistence in schema).',
      );
    }

    if (!dto.status && !dto.verificationStatus) {
      throw new BadRequestException(
        'At least one of status or verificationStatus is required.',
      );
    }

    const exists = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        ...(dto.status ? { status: mapAdminStatusToDb(dto.status) } : {}),
        ...(dto.verificationStatus
          ? {
              verificationStatus: mapAdminVerificationToDb(
                dto.verificationStatus,
              ),
            }
          : {}),
      },
      include: {
        imageAsset: { select: { publicUrl: true } },
        seller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                district: true,
                growerVerificationStatus: true,
              },
            },
          },
        },
      },
    });

    return this.mapToAdmin(updated);
  }
}
