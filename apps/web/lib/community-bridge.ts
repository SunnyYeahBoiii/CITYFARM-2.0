"use client";

import { feedPosts, marketListings, PostType, type FeedPost, type MarketListing } from "./cityfarm-data";

const COMMUNITY_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
const COMMUNITY_MODE = process.env.NEXT_PUBLIC_COMMUNITY_MODE ?? "auto";

type BridgeSource = "api" | "fallback" | "mixed";

type FeedQuery = {
  postType?: PostType;
  district?: string;
  page?: number;
  limit?: number;
};

type ListingsQuery = {
  district?: string;
  page?: number;
  limit?: number;
};

type ApiListResponse<T> = {
  data?: T[];
};

type BridgeResult = {
  posts: FeedPost[];
  listings: MarketListing[];
  source: BridgeSource;
};

export type CreateFeedPostPayload = {
  postType: PostType;
  caption: string;
  gardenPlantId?: string;
  imageAssetId?: string;
  visibilityDistrict?: string;
};

function apiUrl(path: string) {
  return `${COMMUNITY_API_BASE}${path}`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Community request failed (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toQueryString(params?: Record<string, string | number | undefined>) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function unwrapList<T>(payload: T[] | ApiListResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

async function fetchFeedFromApi(params?: FeedQuery): Promise<FeedPost[]> {
  const query = toQueryString({
    postType: params?.postType,
    district: params?.district,
    page: params?.page,
    limit: params?.limit,
  });

  const payload = await apiRequest<FeedPost[] | ApiListResponse<FeedPost>>(`/community/feed${query}`);
  return unwrapList(payload);
}

async function fetchListingsFromApi(params?: ListingsQuery): Promise<MarketListing[]> {
  const query = toQueryString({
    district: params?.district,
    page: params?.page,
    limit: params?.limit,
  });

  const payload = await apiRequest<MarketListing[] | ApiListResponse<MarketListing>>(`/community/marketplace${query}`);
  return unwrapList(payload);
}

function getFallbackPosts() {
  return [...feedPosts];
}

function getFallbackListings() {
  return [...marketListings];
}

export async function loadCommunityData(): Promise<BridgeResult> {
  if (COMMUNITY_MODE === "fallback") {
    return {
      posts: getFallbackPosts(),
      listings: getFallbackListings(),
      source: "fallback",
    };
  }

  const [postsResult, listingsResult] = await Promise.allSettled([
    fetchFeedFromApi({ page: 1, limit: 20 }),
    fetchListingsFromApi({ page: 1, limit: 20 }),
  ]);

  const postsFromApi = postsResult.status === "fulfilled";
  const listingsFromApi = listingsResult.status === "fulfilled";

  const posts = postsFromApi ? postsResult.value : getFallbackPosts();
  const listings = listingsFromApi ? listingsResult.value : getFallbackListings();

  if (postsFromApi && listingsFromApi) {
    return { posts, listings, source: "api" };
  }

  if (!postsFromApi && !listingsFromApi) {
    return { posts, listings, source: "fallback" };
  }

  return { posts, listings, source: "mixed" };
}

export async function createCommunityPost(payload: CreateFeedPostPayload): Promise<FeedPost> {
  if (COMMUNITY_MODE === "fallback") {
    return buildFallbackPost(payload);
  }

  try {
    return await apiRequest<FeedPost>("/community/feed", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    return buildFallbackPost(payload);
  }
}

export async function toggleCommunityLike(postId: string, isLiked: boolean): Promise<boolean> {
  if (COMMUNITY_MODE === "fallback") {
    return !isLiked;
  }

  try {
    const result = await apiRequest<{ isLiked?: boolean; liked?: boolean }>(`/community/feed/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reactionType: "LIKE" }),
    });

    if (typeof result.isLiked === "boolean") {
      return result.isLiked;
    }

    if (typeof result.liked === "boolean") {
      return result.liked;
    }

    return !isLiked;
  } catch {
    return !isLiked;
  }
}

function buildFallbackPost(payload: CreateFeedPostPayload): FeedPost {
  const timestamp = new Date().toISOString();

  return {
    id: `local-${Date.now()}`,
    postType: payload.postType,
    caption: payload.caption,
    gardenPlantId: payload.gardenPlantId,
    imageAssetId: payload.imageAssetId,
    visibilityDistrict: payload.visibilityDistrict,
    isPublished: true,
    publishedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    user: {
      id: "current-user",
      username: "You",
      district: "Local",
      verifiedGrower: false,
    },
    likes: 0,
    comments: 0,
    isLiked: false,
  };
}
