export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPPLIER = "SUPPLIER",
  EXPERT = "EXPERT",
  GUEST = "GUEST",
}

export interface CurrentAdminUser {
  id: string;
  email: string;
  role: UserRole;
  requiresPasswordSetup: boolean;
  profile: {
    id: string;
    displayName: string;
    bio?: string | null;
    city?: string | null;
    district?: string | null;
    ward?: string | null;
    avatarUrl: string | null;
    growerVerificationStatus: string;
    totalHarvests: number;
    totalCareLogs: number;
  } | null;
}

export interface RawProfileResponse {
  id?: string;
  email?: string;
  role?: string;
  requiresPasswordSetup?: boolean;
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

export const GUEST_ADMIN_USER: CurrentAdminUser = {
  id: "",
  email: "",
  role: UserRole.GUEST,
  requiresPasswordSetup: false,
  profile: null,
};

export function mapRawProfileToAdminUser(data: RawProfileResponse | null | undefined): CurrentAdminUser {
  if (!data) {
    return GUEST_ADMIN_USER;
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
