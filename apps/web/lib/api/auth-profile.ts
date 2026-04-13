import type { CurrentUser } from "../types/auth";
import { GUEST_USER, UserRole } from "../types/auth";

export interface RawProfileResponse {
  id?: string;
  email?: string;
  role?: string;
  externalAuthId?: string | null;
  requiresPasswordSetup?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profile?: {
    id?: string;
    displayName?: string;
    bio?: string | null;
    city?: string | null;
    district?: string | null;
    ward?: string | null;
    growerVerificationStatus?: string;
    totalHarvests?: number;
    totalCareLogs?: number;
    avatarAsset?: {
      publicUrl?: string;
    } | null;
  } | null;
}

export function mapRawProfileToCurrentUser(
  data: RawProfileResponse | null | undefined,
): CurrentUser {
  if (!data) {
    return GUEST_USER;
  }

  const role =
    data.role && Object.values(UserRole).includes(data.role as UserRole)
      ? (data.role as UserRole)
      : UserRole.GUEST;

  return {
    id: data.id ?? "",
    email: data.email ?? "",
    role,
    requiresPasswordSetup: data.requiresPasswordSetup ?? false,
    profile: data.profile
      ? {
          id: data.profile.id ?? "",
          displayName: data.profile.displayName ?? "",
          bio: data.profile.bio ?? null,
          city: data.profile.city ?? null,
          district: data.profile.district ?? null,
          ward: data.profile.ward ?? null,
          avatarUrl: data.profile.avatarAsset?.publicUrl ?? null,
          growerVerificationStatus: data.profile.growerVerificationStatus ?? "NONE",
          totalHarvests: data.profile.totalHarvests ?? 0,
          totalCareLogs: data.profile.totalCareLogs ?? 0,
        }
      : null,
  };
}

