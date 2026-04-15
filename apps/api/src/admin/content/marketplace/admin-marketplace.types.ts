export type ListingVerificationStatus =
  | 'NONE'
  | 'PENDING'
  | 'VERIFIED'
  | 'REVOKED';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'HIDDEN';

export type ListingQuality = {
  photoScore: number;
  descriptionScore: number;
  documentationScore: number;
  flags: number;
};

export type MarketplaceListingAdmin = {
  id: string;
  title: string;
  productLabel: string;
  seller: {
    id: string;
    name: string;
    verifiedGrower: boolean;
    district: string;
  };
  pickupDistrict: string;
  pickupCity: string;
  quantityText: string;
  priceText: string;
  createdAtLabel: string;
  expiresAtLabel: string;
  status: ListingStatus;
  verificationStatus: ListingVerificationStatus;
  documentedDays: number;
  imageUrl?: string;
  notes?: string;
  quality: ListingQuality;
};
