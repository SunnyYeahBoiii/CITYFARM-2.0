import { api } from '../client';
import type { CurrentUser } from '../types/auth';
import { GUEST_USER, UserRole } from '../types/auth';

interface RawProfileResponse {
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

function mapRawProfileToCurrentUser(data: RawProfileResponse): CurrentUser {
  const role =
    data.role && Object.values(UserRole).includes(data.role as UserRole)
      ? (data.role as UserRole)
      : UserRole.GUEST;

  return {
    id: data.id ?? '',
    email: data.email ?? '',
    role,
    requiresPasswordSetup: data.requiresPasswordSetup ?? false,
    profile: data.profile
      ? {
          id: data.profile.id ?? '',
          displayName: data.profile.displayName ?? '',
          bio: data.profile.bio ?? null,
          city: data.profile.city ?? null,
          district: data.profile.district ?? null,
          ward: data.profile.ward ?? null,
          avatarUrl: data.profile.avatarAsset?.publicUrl ?? null,
          growerVerificationStatus:
            data.profile.growerVerificationStatus ?? 'NONE',
          totalHarvests: data.profile.totalHarvests ?? 0,
          totalCareLogs: data.profile.totalCareLogs ?? 0,
        }
      : null,
  };
}

export async function getProfile(): Promise<CurrentUser> {
  try {
    const { data } = await api.get<RawProfileResponse>('/auth/profile');
    return mapRawProfileToCurrentUser(data);
  } catch {
    return GUEST_USER;
  }
}

export async function login(email: string, password: string): Promise<void> {
  await api.post('/auth/login', { email, password });
}

/**
 * Register new account
 * @param displayName - Display name (required)
 * @param bio - Bio (optional)
 * @param city - City (optional)
 * @param district - District (optional)
 * @param ward - Ward (optional)
 */
export async function register(data: {
  email: string;
  password: string;
  displayName: string;
  bio?: string;
  city?: string;
  district?: string;
  ward?: string;
}): Promise<void> {
  await api.post('/auth/register', data);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refreshTokens(): Promise<void> {
  await api.post('/auth/refresh');
}

export async function setupPassword(password: string): Promise<void> {
  await api.post('/auth/setup-password', { password });
}
