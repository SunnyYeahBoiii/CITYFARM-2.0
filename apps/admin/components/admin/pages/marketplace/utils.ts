import type { MarketplaceListingAdmin, ListingStatus, ListingVerificationStatus } from "./types";

export type MarketplaceFilter = {
  q: string;
  status: ListingStatus | "ALL";
  verification: ListingVerificationStatus | "ALL";
  district: string | "ALL";
  flaggedOnly: boolean;
  expiringOnly: boolean;
};

export function scoreOverall(listing: MarketplaceListingAdmin): number {
  const base =
    listing.quality.photoScore * 0.45 +
    listing.quality.descriptionScore * 0.25 +
    listing.quality.documentationScore * 0.3;
  const penalty = Math.min(listing.quality.flags * 7, 20);
  return Math.max(0, Math.round(base - penalty));
}

export function matchesFilter(listing: MarketplaceListingAdmin, filter: MarketplaceFilter): boolean {
  const q = filter.q.trim().toLowerCase();
  if (q) {
    const haystack = [
      listing.title,
      listing.productLabel,
      listing.seller.name,
      listing.pickupDistrict,
      listing.seller.district,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (filter.status !== "ALL" && listing.status !== filter.status) return false;
  if (filter.verification !== "ALL" && listing.verificationStatus !== filter.verification) return false;
  if (filter.district !== "ALL" && listing.pickupDistrict !== filter.district) return false;
  if (filter.flaggedOnly && listing.quality.flags <= 0) return false;
  if (filter.expiringOnly && !/today|in 1 day|in 2 days/i.test(listing.expiresAtLabel)) return false;

  return true;
}

export function uniqueDistricts(listings: MarketplaceListingAdmin[]): string[] {
  return Array.from(new Set(listings.map((l) => l.pickupDistrict))).sort((a, b) => a.localeCompare(b));
}

export function countByDistrict(listings: MarketplaceListingAdmin[]): Array<{ district: string; total: number; active: number }> {
  const map = new Map<string, { total: number; active: number }>();
  for (const listing of listings) {
    const entry = map.get(listing.pickupDistrict) ?? { total: 0, active: 0 };
    entry.total += 1;
    if (listing.status === "ACTIVE") entry.active += 1;
    map.set(listing.pickupDistrict, entry);
  }
  return Array.from(map.entries())
    .map(([district, v]) => ({ district, ...v }))
    .sort((a, b) => b.total - a.total || a.district.localeCompare(b.district));
}

