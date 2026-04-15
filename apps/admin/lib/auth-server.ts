import { redirect } from "next/navigation";
import { adminServerFetch } from "./api/server-fetch";
import { getWebBaseUrl } from "./api/config";
import {
  GUEST_ADMIN_USER,
  mapRawProfileToAdminUser,
  type CurrentAdminUser,
  type RawProfileResponse,
  UserRole,
} from "./types/auth";

export async function getAdminUser(): Promise<CurrentAdminUser> {
  try {
    const response = await adminServerFetch("/auth/profile");
    if (!response.ok || !response.data) {
      return GUEST_ADMIN_USER;
    }

    const payload = response.data as RawProfileResponse;
    return mapRawProfileToAdminUser(payload);
  } catch {
    return GUEST_ADMIN_USER;
  }
}

export async function requireAdminUser(): Promise<CurrentAdminUser> {
  const user = await getAdminUser();

  if (user.role === UserRole.GUEST) {
    redirect(`${getWebBaseUrl()}/login`);
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/access-denied");
  }

  return user;
}
