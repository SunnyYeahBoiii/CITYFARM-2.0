import { adminServerFetch } from "./server-fetch";
import type { FeedPostRow } from "@/components/admin/pages/posts/types";
import type { MarketplaceListingAdmin } from "@/components/admin/pages/marketplace/types";
import type { AdminOrder } from "@/components/admin/pages/orders/types";
import type {
  ActivityEvent,
  UserRow,
  VerificationQueueItem,
} from "@/components/admin/pages/users/users-data";

type AdminUsersPayload = {
  users: UserRow[];
  verificationQueue: VerificationQueueItem[];
  activitiesByUser: Record<string, ActivityEvent[]>;
};

async function parseServerResponse<T>(pathname: string): Promise<T> {
  const response = await adminServerFetch(pathname);

  if (!response.ok || response.data === null) {
    const fallback = `Failed to fetch ${pathname}${response.status ? ` (${response.status})` : ""}`;
    throw new Error(response.message || fallback);
  }

  return response.data as T;
}

export async function getAdminPosts(): Promise<FeedPostRow[]> {
  return parseServerResponse<FeedPostRow[]>("/admin/posts");
}

export async function getAdminListings(): Promise<MarketplaceListingAdmin[]> {
  return parseServerResponse<MarketplaceListingAdmin[]>("/admin/marketplace");
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  return parseServerResponse<AdminOrder[]>("/admin/orders");
}

export async function getAdminUsersData(): Promise<AdminUsersPayload> {
  return parseServerResponse<AdminUsersPayload>("/admin/users");
}
