import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ADMIN_LISTING_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'SOLD',
  'EXPIRED',
  'HIDDEN',
] as const;
export type AdminListingStatus = (typeof ADMIN_LISTING_STATUSES)[number];

export const ADMIN_VERIFICATION_STATUSES = [
  'NONE',
  'PENDING',
  'VERIFIED',
  'REVOKED',
] as const;
export type AdminListingVerificationStatus =
  (typeof ADMIN_VERIFICATION_STATUSES)[number];

export class AdminListingPatchDto {
  @IsOptional()
  @IsIn(ADMIN_LISTING_STATUSES)
  status?: AdminListingStatus;

  @IsOptional()
  @IsIn(ADMIN_VERIFICATION_STATUSES)
  verificationStatus?: AdminListingVerificationStatus;

  // No safe place to persist this without schema changes.
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
