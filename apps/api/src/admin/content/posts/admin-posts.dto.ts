import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ADMIN_POST_STATUSES = [
  'PUBLISHED',
  'NEEDS_REVIEW',
  'FLAGGED',
  'HIDDEN',
  'DELETED',
] as const;

export type AdminModerationStatus = (typeof ADMIN_POST_STATUSES)[number];

export const ADMIN_POST_TYPES = [
  'SHOWCASE',
  'QUESTION',
  'PLANT_SHARE',
  'MARKETPLACE_SHARE',
  'HARVEST_UPDATE',
] as const;

export type AdminPostType = (typeof ADMIN_POST_TYPES)[number];

export class AdminPostPatchDto {
  @IsIn(ADMIN_POST_STATUSES)
  status: AdminModerationStatus;

  // No place to persist this in schema yet; accepted to match contract but rejected in service if present.
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  moderationNote?: string;
}
