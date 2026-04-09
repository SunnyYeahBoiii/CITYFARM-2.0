import { cookies } from 'next/headers';
import type { CurrentUser } from './types/auth';
import { GUEST_USER, UserRole } from './types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RawProfileResponse {
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

function mapRawToCurrentUser(data: RawProfileResponse): CurrentUser {
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


/**
 * Get CurrentUser trong Server Components / Route Handlers / Server Actions.
 *
 * @example — Use in Server Component:
 * ```tsx
 * import { getUser } from '@/lib/auth-server';
 *
 * export default async function Layout({ children }) {
 *   const user = await getUser();
 *   return <AuthProvider initialUser={user}>{children}</AuthProvider>;
 * }
 * ```
 *
 * @example — Guard in Route Handler:
 * ```ts
 * const user = await getUser();
 * if (!isAuthenticated(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * ```
 */
export async function getUser(): Promise<CurrentUser> {
  let refreshToken: string | undefined;

  try {
    const cookieStore = await cookies();
    refreshToken = cookieStore.get('refresh_token')?.value;
  } catch {
    return GUEST_USER;
  }

  if (!refreshToken) {
    return GUEST_USER;
  }

  try {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return GUEST_USER;
    }

    const data = (await res.json()) as RawProfileResponse;
    return mapRawToCurrentUser(data);
  } catch {
    return GUEST_USER;
  }
}
