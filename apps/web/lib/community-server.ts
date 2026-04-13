import type { CommunityDataResponse, FeedPost, MarketListing } from "./types/community";
import { readSessionCookies, serverApiFetch } from "./api/server-fetch";

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
  const response = await serverApiFetch(pathname);

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as unknown;
  return normalizeCollection<T>(payload);
}

export async function getCommunityData(): Promise<CommunityDataResponse> {
  const { accessToken } = await readSessionCookies();
  if (!accessToken) {
    return { posts: [], listings: [] };
  }

  const [posts, listings] = await Promise.all([
    serverGet<FeedPost>("/community/feed"),
    serverGet<MarketListing>("/community/marketplace"),
  ]);

  return { posts, listings };
}
