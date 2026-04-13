import type { CurrentUser } from "./types/auth";
import { GUEST_USER } from "./types/auth";
import { mapRawProfileToCurrentUser, type RawProfileResponse } from "./api/auth-profile";
import { readSessionCookies, serverApiFetch } from "./api/server-fetch";


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
  const { refreshToken } = await readSessionCookies();

  if (!refreshToken) {
    return GUEST_USER;
  }

  try {
    const res = await serverApiFetch("/auth/profile");

    if (!res.ok) {
      return GUEST_USER;
    }

    const data = (await res.json()) as RawProfileResponse;
    return mapRawProfileToCurrentUser(data);
  } catch {
    return GUEST_USER;
  }
}
