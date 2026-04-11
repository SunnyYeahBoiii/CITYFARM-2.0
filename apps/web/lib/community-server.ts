import { cookies } from "next/headers";
import type { CommunityDataResponse, FeedPost, MarketListing } from "./types/community";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function normalizeCollection<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: T[] }).data;
  }

  return [];
}

async function serverGet<T>(pathname: string): Promise<T[]> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const response = await fetch(`${API_URL}${pathname}`, {
    cache: "no-store",
    headers: refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : undefined,
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as unknown;
  return normalizeCollection<T>(payload);
}

export async function getCommunityData(): Promise<CommunityDataResponse> {
  const [posts, listings] = await Promise.all([
    serverGet<FeedPost>("/community/feed"),
    serverGet<MarketListing>("/community/marketplace"),
  ]);

  return { posts, listings };
}
